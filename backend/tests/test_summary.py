"""Pruebas de HU-05 (cálculo automático de saldo y resumen)."""
from datetime import date

from app.core.database import SessionLocal
from app.models.models import Category


def _auth(client, email):
    token = client.post(
        "/auth/register", json={"email": email, "password": "clave12345", "name": "T"}
    ).json()["access_token"]
    return {"Authorization": f"Bearer {token}"}


def _user_id(client, headers):
    return client.get("/auth/me", headers=headers).json()["id"]


def _category(user_id, name):
    with SessionLocal() as db:
        category = Category(user_id=user_id, name=name)
        db.add(category)
        db.commit()
        return category.id


def _tx(client, headers, tx_type, amount, day, category_id=None):
    return client.post(
        "/transactions",
        json={
            "type": tx_type,
            "amount": amount,
            "date": day,
            "category_id": category_id,
            "description": "",
        },
        headers=headers,
    )


def _este_mes(dia=15):
    """Un día del mes actual, para probar el comportamiento por defecto del endpoint."""
    return date.today().replace(day=dia).isoformat()


def test_requiere_token(client):
    assert client.get("/transactions/summary").status_code == 401


def test_usuario_sin_movimientos_devuelve_todo_en_cero(client):
    h = _auth(client, "s1@test.com")
    body = client.get("/transactions/summary", headers=h).json()
    assert body["balance"] == 0
    assert body["total_income"] == 0 and body["total_expense"] == 0
    assert body["month"]["balance"] == 0
    assert body["by_category"] == []


def test_saldo_es_ingresos_menos_gastos(client):
    h = _auth(client, "s2@test.com")
    _tx(client, h, "income", 1500, "2026-08-05")
    _tx(client, h, "income", 500, "2026-08-10")
    _tx(client, h, "expense", 300, "2026-08-12")
    _tx(client, h, "expense", 200.50, "2026-08-20")

    body = client.get("/transactions/summary?month=2026-08", headers=h).json()
    assert body["total_income"] == 2000
    assert body["total_expense"] == 500.50
    assert body["balance"] == 1499.50


def test_saldo_puede_ser_negativo(client):
    h = _auth(client, "s3@test.com")
    _tx(client, h, "income", 100, "2026-08-01")
    _tx(client, h, "expense", 250, "2026-08-02")
    assert client.get("/transactions/summary", headers=h).json()["balance"] == -150


def test_saldo_es_historico_pero_el_mes_solo_cuenta_su_periodo(client):
    h = _auth(client, "s4@test.com")
    _tx(client, h, "income", 1000, "2026-07-15")  # mes anterior
    _tx(client, h, "expense", 400, "2026-08-10")  # mes consultado

    body = client.get("/transactions/summary?month=2026-08", headers=h).json()
    assert body["balance"] == 600, "el saldo suma toda la historia"
    assert body["month"]["income"] == 0 and body["month"]["expense"] == 400
    assert body["month"]["balance"] == -400, "el mes solo mira agosto"


def test_limites_del_mes_son_inclusivos(client):
    h = _auth(client, "s5@test.com")
    _tx(client, h, "expense", 10, "2026-07-31")
    _tx(client, h, "expense", 20, "2026-08-01")
    _tx(client, h, "expense", 30, "2026-08-31")
    _tx(client, h, "expense", 40, "2026-09-01")

    mes = client.get("/transactions/summary?month=2026-08", headers=h).json()["month"]
    assert mes["expense"] == 50, "solo el 1 y el 31 de agosto"


def test_febrero_bisiesto(client):
    h = _auth(client, "s6@test.com")
    _tx(client, h, "expense", 99, "2028-02-29")
    mes = client.get("/transactions/summary?month=2028-02", headers=h).json()["month"]
    assert mes["month"] == "2028-02" and mes["expense"] == 99


def test_desglose_por_categoria(client):
    h = _auth(client, "s7@test.com")
    uid = _user_id(client, h)
    comida = _category(uid, "Comida")
    transporte = _category(uid, "Transporte")
    _tx(client, h, "expense", 300, "2026-08-05", comida)
    _tx(client, h, "expense", 150, "2026-08-06", comida)
    _tx(client, h, "expense", 100, "2026-08-07", transporte)

    desglose = client.get("/transactions/summary?month=2026-08", headers=h).json()["by_category"]
    assert len(desglose) == 2
    # ordenado de mayor a menor gasto
    assert desglose[0]["category_name"] == "Comida" and desglose[0]["expense"] == 450
    assert desglose[1]["category_name"] == "Transporte" and desglose[1]["expense"] == 100


def test_una_categoria_junta_ingreso_y_gasto_en_una_fila(client):
    h = _auth(client, "s8@test.com")
    cat = _category(_user_id(client, h), "Freelance")
    _tx(client, h, "income", 800, "2026-08-05", cat)
    _tx(client, h, "expense", 200, "2026-08-06", cat)

    desglose = client.get("/transactions/summary?month=2026-08", headers=h).json()["by_category"]
    assert len(desglose) == 1
    fila = desglose[0]
    assert fila["income"] == 800 and fila["expense"] == 200 and fila["balance"] == 600


def test_transacciones_sin_categoria_se_agrupan_aparte(client):
    h = _auth(client, "s9@test.com")
    cat = _category(_user_id(client, h), "Comida")
    _tx(client, h, "expense", 100, "2026-08-05", cat)
    _tx(client, h, "expense", 70, "2026-08-06", None)

    desglose = client.get("/transactions/summary?month=2026-08", headers=h).json()["by_category"]
    sin_categoria = [f for f in desglose if f["category_id"] is None]
    assert len(sin_categoria) == 1
    assert sin_categoria[0]["category_name"] is None and sin_categoria[0]["expense"] == 70


def test_sin_parametro_usa_el_mes_actual(client):
    h = _auth(client, "s10@test.com")
    _tx(client, h, "income", 900, _este_mes())
    _tx(client, h, "expense", 400, _este_mes(20))

    body = client.get("/transactions/summary", headers=h).json()
    assert body["month"]["month"] == date.today().strftime("%Y-%m")
    assert body["month"]["income"] == 900 and body["month"]["balance"] == 500


def test_mes_invalido_devuelve_422(client):
    h = _auth(client, "s11@test.com")
    assert client.get("/transactions/summary?month=2026-13", headers=h).status_code == 422
    assert client.get("/transactions/summary?month=hola", headers=h).status_code == 422
    assert client.get("/transactions/summary?month=2026", headers=h).status_code == 422


def test_no_mezcla_datos_de_otro_usuario(client):
    h1 = _auth(client, "s12a@test.com")
    h2 = _auth(client, "s12b@test.com")
    _tx(client, h1, "income", 5000, "2026-08-01")

    body = client.get("/transactions/summary?month=2026-08", headers=h2).json()
    assert body["balance"] == 0 and body["by_category"] == []


def test_la_ruta_summary_no_choca_con_la_de_id(client):
    """/transactions/summary no debe interpretarse como /transactions/{id}."""
    h = _auth(client, "s13@test.com")
    assert client.get("/transactions/summary", headers=h).status_code == 200
    assert client.get("/transactions/999999", headers=h).status_code == 404
    assert client.get("/transactions/abc", headers=h).status_code == 422


def test_el_saldo_refleja_altas_y_bajas(client):
    h = _auth(client, "s14@test.com")
    _tx(client, h, "income", 1000, "2026-08-01")
    gasto_id = _tx(client, h, "expense", 400, "2026-08-02").json()["id"]
    assert client.get("/transactions/summary", headers=h).json()["balance"] == 600

    client.delete(f"/transactions/{gasto_id}", headers=h)
    assert client.get("/transactions/summary", headers=h).json()["balance"] == 1000
