"""Pruebas de HU-04 (CRUD de ingresos y gastos)."""
from datetime import date

from app.core.database import SessionLocal
from app.models.models import Category


def _auth(client, email):
    """Registra un usuario y devuelve sus headers con el Bearer token."""
    token = client.post(
        "/auth/register", json={"email": email, "password": "clave12345", "name": "T"}
    ).json()["access_token"]
    return {"Authorization": f"Bearer {token}"}


def _user_id(client, headers):
    return client.get("/auth/me", headers=headers).json()["id"]


def _category(user_id, name="Comida"):
    """Crea una categoría en BD: el módulo categories es HU-03 y aún no está expuesto."""
    with SessionLocal() as db:
        category = Category(user_id=user_id, name=name)
        db.add(category)
        db.commit()
        return category.id


def _new(client, headers, **overrides):
    body = {"type": "expense", "amount": 100, "date": "2026-09-01", "description": "x"}
    body.update(overrides)
    return client.post("/transactions", json=body, headers=headers)


def test_requiere_token(client):
    assert client.get("/transactions").status_code == 401
    assert client.post("/transactions", json={}).status_code == 401


def test_crear_gasto(client):
    h = _auth(client, "t1@test.com")
    resp = _new(client, h, type="expense", amount=250.5, description="Supermercado")
    assert resp.status_code == 201
    body = resp.json()
    assert body["type"] == "expense"
    assert body["amount"] == 250.5
    assert body["description"] == "Supermercado"
    assert body["category_id"] is None and body["category_name"] is None
    assert body["id"] > 0


def test_crear_ingreso_con_categoria_devuelve_nombre(client):
    h = _auth(client, "t2@test.com")
    cat_id = _category(_user_id(client, h), "Salario")
    body = _new(client, h, type="income", amount=1000, category_id=cat_id).json()
    assert body["type"] == "income"
    assert body["category_id"] == cat_id and body["category_name"] == "Salario"


def test_monto_debe_ser_mayor_a_cero(client):
    h = _auth(client, "t3@test.com")
    assert _new(client, h, amount=0).status_code == 422
    assert _new(client, h, amount=-50).status_code == 422


def test_tipo_invalido_devuelve_422(client):
    h = _auth(client, "t4@test.com")
    assert _new(client, h, type="regalo").status_code == 422


def test_categoria_inexistente_devuelve_404(client):
    h = _auth(client, "t5@test.com")
    assert _new(client, h, category_id=99999).status_code == 404


def test_no_puede_usar_categoria_de_otro_usuario(client):
    h1 = _auth(client, "t6a@test.com")
    h2 = _auth(client, "t6b@test.com")
    ajena = _category(_user_id(client, h1), "Privada")
    assert _new(client, h2, category_id=ajena).status_code == 404


def test_listar_ordena_de_mas_reciente_a_mas_antigua(client):
    h = _auth(client, "t7@test.com")
    _new(client, h, date="2026-08-01", description="vieja")
    _new(client, h, date="2026-08-20", description="nueva")
    items = client.get("/transactions", headers=h).json()["items"]
    assert [i["description"] for i in items] == ["nueva", "vieja"]


def test_filtro_por_tipo(client):
    h = _auth(client, "t8@test.com")
    _new(client, h, type="income", amount=500)
    _new(client, h, type="expense", amount=200)
    _new(client, h, type="expense", amount=300)

    ingresos = client.get("/transactions?type=income", headers=h).json()
    gastos = client.get("/transactions?type=expense", headers=h).json()
    assert ingresos["total"] == 1 and len(ingresos["items"]) == 1
    assert gastos["total"] == 2


def test_filtro_por_categoria(client):
    h = _auth(client, "t9@test.com")
    uid = _user_id(client, h)
    comida = _category(uid, "Comida")
    _category(uid, "Transporte")
    _new(client, h, category_id=comida)
    _new(client, h)

    resp = client.get(f"/transactions?category_id={comida}", headers=h).json()
    assert resp["total"] == 1 and resp["items"][0]["category_id"] == comida


def test_filtro_por_rango_de_fechas_inclusivo(client):
    h = _auth(client, "t10@test.com")
    for d in ("2026-07-31", "2026-08-01", "2026-08-15", "2026-08-31", "2026-09-01"):
        _new(client, h, date=d)

    resp = client.get("/transactions?date_from=2026-08-01&date_to=2026-08-31", headers=h).json()
    assert resp["total"] == 3
    assert {i["date"] for i in resp["items"]} == {"2026-08-01", "2026-08-15", "2026-08-31"}


def test_rango_de_fechas_invertido_devuelve_422(client):
    h = _auth(client, "t11@test.com")
    resp = client.get("/transactions?date_from=2026-09-10&date_to=2026-09-01", headers=h)
    assert resp.status_code == 422


def test_paginacion(client):
    h = _auth(client, "t12@test.com")
    for i in range(5):
        _new(client, h, amount=i + 1, date=f"2026-08-0{i + 1}")

    pagina = client.get("/transactions?limit=2&offset=0", headers=h).json()
    assert pagina["total"] == 5 and len(pagina["items"]) == 2
    assert pagina["limit"] == 2 and pagina["offset"] == 0

    segunda = client.get("/transactions?limit=2&offset=2", headers=h).json()
    assert len(segunda["items"]) == 2
    ids_primera = {i["id"] for i in pagina["items"]}
    assert ids_primera.isdisjoint({i["id"] for i in segunda["items"]})


def test_limite_de_paginacion_fuera_de_rango(client):
    h = _auth(client, "t13@test.com")
    assert client.get("/transactions?limit=0", headers=h).status_code == 422
    assert client.get("/transactions?limit=999", headers=h).status_code == 422
    assert client.get("/transactions?offset=-1", headers=h).status_code == 422


def test_obtener_por_id(client):
    h = _auth(client, "t14@test.com")
    tx_id = _new(client, h, amount=42).json()["id"]
    resp = client.get(f"/transactions/{tx_id}", headers=h)
    assert resp.status_code == 200 and resp.json()["amount"] == 42
    assert client.get("/transactions/99999", headers=h).status_code == 404


def test_actualizacion_parcial_solo_toca_lo_enviado(client):
    h = _auth(client, "t15@test.com")
    tx_id = _new(client, h, amount=100, description="original").json()["id"]

    body = client.patch(f"/transactions/{tx_id}", json={"amount": 175.25}, headers=h).json()
    assert body["amount"] == 175.25
    assert body["description"] == "original"
    assert body["type"] == "expense"


def test_actualizar_categoria_y_quitarla_con_null(client):
    h = _auth(client, "t16@test.com")
    cat_id = _category(_user_id(client, h), "Ocio")
    tx_id = _new(client, h).json()["id"]

    con_cat = client.patch(f"/transactions/{tx_id}", json={"category_id": cat_id}, headers=h).json()
    assert con_cat["category_id"] == cat_id and con_cat["category_name"] == "Ocio"

    sin_cat = client.patch(f"/transactions/{tx_id}", json={"category_id": None}, headers=h).json()
    assert sin_cat["category_id"] is None and sin_cat["category_name"] is None


def test_actualizar_tipo_fecha_y_descripcion(client):
    h = _auth(client, "t15b@test.com")
    tx_id = _new(client, h, type="expense", date="2026-08-01", description="original").json()["id"]

    body = client.patch(
        f"/transactions/{tx_id}",
        json={"type": "income", "date": "2026-08-20", "description": "corregida"},
        headers=h,
    ).json()
    assert body["type"] == "income"
    assert body["date"] == "2026-08-20"
    assert body["description"] == "corregida"


def test_actualizar_con_monto_invalido_o_categoria_inexistente(client):
    h = _auth(client, "t17@test.com")
    tx_id = _new(client, h).json()["id"]
    assert client.patch(f"/transactions/{tx_id}", json={"amount": 0}, headers=h).status_code == 422
    assert client.patch(
        f"/transactions/{tx_id}", json={"category_id": 99999}, headers=h
    ).status_code == 404


def test_eliminar(client):
    h = _auth(client, "t18@test.com")
    tx_id = _new(client, h).json()["id"]
    assert client.delete(f"/transactions/{tx_id}", headers=h).status_code == 204
    assert client.get(f"/transactions/{tx_id}", headers=h).status_code == 404
    assert client.delete(f"/transactions/{tx_id}", headers=h).status_code == 404


def test_no_ve_ni_toca_transacciones_de_otro_usuario(client):
    h1 = _auth(client, "t19a@test.com")
    h2 = _auth(client, "t19b@test.com")
    ajena = _new(client, h1, description="privada").json()["id"]

    assert client.get("/transactions", headers=h2).json()["total"] == 0
    assert client.get(f"/transactions/{ajena}", headers=h2).status_code == 404
    assert client.patch(f"/transactions/{ajena}", json={"amount": 1}, headers=h2).status_code == 404
    assert client.delete(f"/transactions/{ajena}", headers=h2).status_code == 404


def test_fecha_en_formato_invalido(client):
    h = _auth(client, "t20@test.com")
    assert _new(client, h, date="01-09-2026").status_code == 422


def test_presupuestos_ven_los_gastos_creados_por_la_api(client):
    """HU-04 alimenta a HU-11: el gasto creado por API cuenta en el presupuesto."""
    h = _auth(client, "t21@test.com")
    cat_id = _category(_user_id(client, h), "Comida")
    hoy = date.today().isoformat()
    _new(client, h, type="expense", amount=300, date=hoy, category_id=cat_id)
    client.put("/budgets", json={"category_id": cat_id, "monthly_limit": 1000}, headers=h)

    estado = client.get("/budgets/status", headers=h).json()["budgets"][0]
    assert estado["spent"] == 300 and estado["percent_used"] == 30.0
