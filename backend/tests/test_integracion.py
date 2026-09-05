"""Pruebas de integración entre módulos (HU-09).

Los demás archivos de tests prueban un módulo cada uno. Estos prueban lo que
ninguno ve: que la salida de un módulo sirva de entrada al siguiente. Un
`test_categories.py` verde y un `test_budgets.py` verde no garantizan que
registrarse, gastar y recibir la alerta funcione de punta a punta.

Cada prueba usa un usuario propio: la base se crea una sola vez por corrida
(conftest.py) y los datos de una prueba serían visibles en la siguiente.
"""
from datetime import date

ALIMENTACION = "Alimentación"


def _registrar(client, email):
    """Registra un usuario y devuelve (headers, user_id)."""
    resp = client.post(
        "/auth/register",
        json={"email": email, "password": "clave12345", "name": "Integración"},
    )
    assert resp.status_code == 201, resp.text
    cuerpo = resp.json()
    return {"Authorization": f"Bearer {cuerpo['access_token']}"}, cuerpo["user"]["id"]


def _id_de_categoria(client, headers, nombre):
    categorias = client.get("/categories", headers=headers).json()
    return next(c["id"] for c in categorias if c["name"] == nombre)


def _gasto(client, headers, category_id, monto):
    return client.post(
        "/transactions",
        json={
            "type": "expense",
            "amount": monto,
            "date": date.today().isoformat(),
            "category_id": category_id,
            "description": "Integración",
        },
        headers=headers,
    )


# --- flujo completo ---

def test_flujo_registro_gasto_saldo_presupuesto_alerta(client):
    """El recorrido que hace una persona real, en un solo hilo.

    registro → categorías por defecto → transacciones → saldo → presupuesto →
    alerta. Si alguno de los seis módulos cambia su contrato, esta prueba cae.
    """
    headers, _ = _registrar(client, "int1@test.com")

    # 1. Registrarse deja las nueve categorías por defecto (HU-03 dentro de HU-01).
    categorias = client.get("/categories", headers=headers).json()
    assert len(categorias) == 9
    alimentacion = _id_de_categoria(client, headers, ALIMENTACION)

    # 2. Un ingreso y un gasto del mes en curso (HU-04).
    client.post(
        "/transactions",
        json={
            "type": "income",
            "amount": 200000,
            "date": date.today().isoformat(),
            "description": "Salario",
        },
        headers=headers,
    )
    assert _gasto(client, headers, alimentacion, 90000).status_code == 201

    # 3. El saldo y el desglose del mes salen de esas transacciones (HU-05).
    resumen = client.get("/transactions/summary", headers=headers).json()
    assert resumen["balance"] == 110000
    assert resumen["month"]["income"] == 200000
    assert resumen["month"]["expense"] == 90000
    fila = next(c for c in resumen["by_category"] if c["category_id"] == alimentacion)
    assert fila["expense"] == 90000

    # 4. Se fija un presupuesto sobre esa misma categoría (HU-11).
    presupuesto = client.put(
        "/budgets",
        json={"category_id": alimentacion, "monthly_limit": 100000},
        headers=headers,
    )
    assert presupuesto.status_code == 200

    # 5. El estado cruza gasto y límite: 90 000 de 100 000 son 90%, aviso.
    estado = client.get("/budgets/status", headers=headers).json()
    assert estado["has_alerts"] is True
    aviso = next(a for a in estado["alerts"] if a["category_id"] == alimentacion)
    assert aviso["spent"] == 90000
    assert aviso["percent_used"] == 90.0
    assert aviso["status"] == "warning"
    assert aviso["category_name"] == ALIMENTACION

    # 6. Un gasto más lo pasa del límite: el mismo presupuesto cambia de estado.
    _gasto(client, headers, alimentacion, 20000)
    excedido = client.get("/budgets/status", headers=headers).json()["alerts"]
    aviso = next(a for a in excedido if a["category_id"] == alimentacion)
    assert aviso["spent"] == 110000
    assert aviso["status"] == "exceeded"
    assert aviso["remaining"] == -10000


def test_sin_gastos_no_hay_alertas(client):
    """Un presupuesto recién creado, sin gasto, no genera aviso."""
    headers, _ = _registrar(client, "int2@test.com")
    alimentacion = _id_de_categoria(client, headers, ALIMENTACION)
    client.put(
        "/budgets",
        json={"category_id": alimentacion, "monthly_limit": 50000},
        headers=headers,
    )

    estado = client.get("/budgets/status", headers=headers).json()
    assert estado["has_alerts"] is False
    assert estado["alerts"] == []
    assert estado["budgets"][0]["status"] == "ok"
    assert estado["budgets"][0]["percent_used"] == 0.0


# --- casos límite cruzados ---

def test_resumen_de_un_mes_sin_datos(client):
    """Un mes sin movimientos devuelve ceros, no un error ni una lista ausente."""
    headers, _ = _registrar(client, "int3@test.com")

    resumen = client.get("/transactions/summary?month=2020-01", headers=headers).json()
    assert resumen["balance"] == 0
    assert resumen["month"]["month"] == "2020-01"
    assert resumen["month"]["income"] == 0
    assert resumen["month"]["expense"] == 0
    assert resumen["by_category"] == []

    estado = client.get("/budgets/status?month=2020-01", headers=headers).json()
    assert estado["budgets"] == []
    assert estado["has_alerts"] is False


def test_no_se_puede_gastar_en_la_categoria_de_otro(client):
    """El aislamiento por usuario tiene que sostenerse ENTRE módulos.

    categories devuelve 404 por una categoría ajena; transactions tiene que
    hacer lo mismo al recibirla como category_id, o un usuario podría escribir
    en la categoría de otro sin llegar nunca a /categories.
    """
    ajeno, _ = _registrar(client, "int4a@test.com")
    propio, _ = _registrar(client, "int4b@test.com")
    categoria_ajena = _id_de_categoria(client, ajeno, ALIMENTACION)

    assert client.get(f"/categories/{categoria_ajena}", headers=propio).status_code == 404
    assert _gasto(client, propio, categoria_ajena, 1000).status_code == 404


def test_no_se_puede_presupuestar_la_categoria_de_otro(client):
    """Mismo aislamiento, esta vez entre categories y budgets."""
    ajeno, _ = _registrar(client, "int5a@test.com")
    propio, _ = _registrar(client, "int5b@test.com")
    categoria_ajena = _id_de_categoria(client, ajeno, ALIMENTACION)

    resp = client.put(
        "/budgets",
        json={"category_id": categoria_ajena, "monthly_limit": 5000},
        headers=propio,
    )
    assert resp.status_code == 404


def test_no_se_borra_una_categoria_con_presupuesto(client):
    """El presupuesto de HU-11 bloquea el borrado de HU-03.

    Esta regla nació DESPUÉS de los criterios de HU-03, cuando budgets agregó
    la llave foránea. Se prueba acá porque es exactamente el tipo de acuerdo
    entre dos módulos que ninguna prueba unitaria vigila.
    """
    headers, _ = _registrar(client, "int6@test.com")
    alimentacion = _id_de_categoria(client, headers, ALIMENTACION)
    client.put(
        "/budgets",
        json={"category_id": alimentacion, "monthly_limit": 30000},
        headers=headers,
    )

    resp = client.delete(f"/categories/{alimentacion}", headers=headers)
    assert resp.status_code == 409
    assert "presupuesto" in resp.json()["detail"].lower()
    # Y la categoría sigue viva: el 409 no puede dejar el borrado a medias.
    assert client.get(f"/categories/{alimentacion}", headers=headers).status_code == 200
