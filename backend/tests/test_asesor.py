"""Pruebas del asesor conversacional (POST /ai/ask).

Lo que se prueba de verdad acá es que la ARITMÉTICA no depende del modelo:
todas estas corren sin ANTHROPIC_API_KEY, así que `source` es siempre "rules"
y los números salen de Python. Si algún día el LLM se cae en producción, este
comportamiento es exactamente el que va a ver el usuario.
"""
from datetime import date

import pytest

from app.core.database import SessionLocal
from app.models.models import Budget, Category, Goal, Transaction, TransactionType
from app.modules.ai import asesor


def _auth(client, email):
    token = client.post(
        "/auth/register", json={"email": email, "password": "clave12345", "name": "T"}
    ).json()["access_token"]
    return {"Authorization": f"Bearer {token}"}


def _user_id(client, headers):
    return client.get("/auth/me", headers=headers).json()["id"]


def _seed(user_id, *, incomes=(), expenses=(), category="Súper", limite=None, meta=None):
    with SessionLocal() as db:
        cat = Category(user_id=user_id, name=category)
        db.add(cat)
        db.flush()
        hoy = date.today()
        for a in incomes:
            db.add(Transaction(user_id=user_id, type=TransactionType.income, amount=a, date=hoy))
        for a in expenses:
            db.add(Transaction(user_id=user_id, category_id=cat.id,
                               type=TransactionType.expense, amount=a, date=hoy))
        if limite is not None:
            db.add(Budget(user_id=user_id, category_id=None, monthly_limit=limite))
        if meta is not None:
            nombre, objetivo, ahorrado = meta
            db.add(Goal(user_id=user_id, name=nombre, target_amount=objetivo, saved_amount=ahorrado))
        db.commit()
        return cat.id


# ─── Lectura de montos ───────────────────────────────────────────────────────

@pytest.mark.parametrize("texto,esperado", [
    ("¿me alcanza para unos tenis de 45000?", 45000),
    ("¿me alcanza para unos tenis de 45.000?", 45000),
    ("¿me alcanza para algo de 45 000 colones?", 45000),
    ("¿me da para ₡45,000?", 45000),
    ("¿me alcanza para 45 mil?", 45000),
    ("¿me alcanza para 45k?", 45000),
    ("¿me alcanza para 12,5 mil?", 12500),
])
def test_lee_el_monto_de_la_pregunta(texto, esperado):
    assert asesor.monto_en_pregunta(texto) == esperado


def test_ignora_numeros_que_no_son_montos():
    assert asesor.monto_en_pregunta("¿cómo voy en los primeros 5 días?") is None
    assert asesor.monto_en_pregunta("¿en qué se me va la plata?") is None


# ─── Aritmética del veredicto ────────────────────────────────────────────────

def _ctx(**kw):
    base = dict(mes="2026-09", ingresos=800000, gastos=300000, saldo=500000,
                dias_del_mes=30, dias_transcurridos=10, dias_restantes=20,
                gasto_diario_promedio=30000, disponible=200000,
                tiene_presupuesto=True, disponible_por_dia=10000)
    base.update(kw)
    return asesor.ContextoFinanciero(**base)


def test_alcanza_holgado():
    v = asesor.evaluar_compra(_ctx(), 20000)          # 20 000 de 200 000 disponibles
    assert v.alcanza and not v.justo
    assert v.disponible_despues == 180000
    assert "Sí alcanza" in v.resumen


def test_no_alcanza_dice_cuanto_falta():
    v = asesor.evaluar_compra(_ctx(), 250000)
    assert not v.alcanza
    assert v.disponible_despues == -50000
    assert "50" in v.resumen and "faltan" in v.resumen


def test_justo_cuando_se_lleva_la_mitad_o_mas():
    v = asesor.evaluar_compra(_ctx(), 120000)          # 60 % de lo disponible
    assert v.alcanza and v.justo
    assert v.porcentaje_de_lo_disponible == 60.0
    assert "se lleva el 60" in v.resumen


def test_avisa_cuando_el_ritmo_no_llega_a_fin_de_mes():
    # quedan 20 días, viene gastando 30 000/día => necesitaría 600 000 y solo tiene 200 000
    v = asesor.evaluar_compra(_ctx(), 10000)
    assert v.alcanza and not v.ritmo_sostenible
    assert "no llega a fin de mes" in v.resumen


def test_no_avisa_del_ritmo_cuando_si_sostiene():
    ctx = _ctx(gasto_diario_promedio=5000, disponible=200000)   # 5 000 x 20 = 100 000 < 200 000
    v = asesor.evaluar_compra(ctx, 10000)
    assert v.ritmo_sostenible
    assert "fin de mes" not in v.resumen


def test_mes_cerrado_no_divide_entre_cero():
    v = asesor.evaluar_compra(_ctx(dias_restantes=0, dias_transcurridos=30), 10000)
    assert v.por_dia_despues == v.disponible_despues
    assert v.ritmo_sostenible


def test_montos_en_formato_costarricense():
    # miles con espacio duro, como formato.ts — nunca ₡180,000
    assert asesor.crc(180000) == "₡180\u00a0000"
    assert "," not in asesor.crc(1250000)


# ─── Endpoint ────────────────────────────────────────────────────────────────

def test_requiere_token(client):
    assert client.post("/ai/ask", json={"question": "hola"}).status_code == 401


def test_pregunta_muy_corta_es_422(client):
    h = _auth(client, "as0@test.com")
    assert client.post("/ai/ask", json={"question": "a"}, headers=h).status_code == 422


def test_responde_sin_api_key_con_reglas(client):
    h = _auth(client, "as1@test.com")
    _seed(_user_id(client, h), incomes=[800000], expenses=[300000], limite=500000)
    body = client.post("/ai/ask", headers=h,
                       json={"question": "¿me alcanza para unos tenis de 45 mil?"}).json()
    assert body["source"] == "rules"          # sin key configurada en pruebas
    assert body["veredicto"]["monto"] == 45000
    assert body["veredicto"]["alcanza"] is True
    assert body["contexto"]["gastos"] == 300000


def test_el_contexto_viaja_para_que_la_app_muestre_las_cifras(client):
    h = _auth(client, "as2@test.com")
    _seed(_user_id(client, h), incomes=[500000], expenses=[120000], category="Transporte")
    body = client.post("/ai/ask", headers=h,
                       json={"question": "¿en qué se me va la plata?"}).json()
    assert body["contexto"]["top_categorias"][0]["nombre"] == "Transporte"
    assert body["contexto"]["top_categorias"][0]["gastado"] == 120000
    assert "Transporte" in body["respuesta"]


def test_sin_datos_no_inventa(client):
    h = _auth(client, "as3@test.com")
    body = client.post("/ai/ask", headers=h,
                       json={"question": "¿en qué se me va la plata?"}).json()
    assert "todavía no hay gastos" in body["respuesta"].lower()


def test_pregunta_de_meta(client):
    h = _auth(client, "as4@test.com")
    _seed(_user_id(client, h), incomes=[300000], expenses=[50000],
          meta=("Viaje", 1000000, 150000))
    body = client.post("/ai/ask", headers=h,
                       json={"question": "¿cómo va mi meta de ahorro?"}).json()
    assert "Viaje" in body["respuesta"]


def test_el_mes_se_puede_pedir_explicito(client):
    h = _auth(client, "as5@test.com")
    body = client.post("/ai/ask", headers=h,
                       json={"question": "¿cuánto llevo gastado?", "month": "2026-01"}).json()
    assert body["mes"] == "2026-01"
    assert body["contexto"]["gastos"] == 0
