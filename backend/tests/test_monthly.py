"""Pruebas de HU-19 (evolución mensual, GET /transactions/monthly)."""
import calendar
from datetime import date


def _auth(client, email):
    token = client.post(
        "/auth/register", json={"email": email, "password": "clave12345", "name": "T"}
    ).json()["access_token"]
    return {"Authorization": f"Bearer {token}"}


def _tx(client, headers, tx_type, amount, day):
    return client.post(
        "/transactions",
        json={
            "type": tx_type,
            "amount": amount,
            "date": day,
            "category_id": None,
            "description": "",
        },
        headers=headers,
    )


def _mes(delta: int) -> str:
    """Etiqueta YYYY-MM del mes actual corrido `delta` meses (negativo = atrás)."""
    hoy = date.today()
    total = hoy.year * 12 + (hoy.month - 1) + delta
    return f"{total // 12:04d}-{total % 12 + 1:02d}"


def _dia(delta: int, dia: int = 15) -> str:
    """Una fecha real dentro del mes `delta`, recortando al último día si hace falta."""
    etiqueta = _mes(delta)
    year, month = int(etiqueta[:4]), int(etiqueta[5:])
    return date(year, month, min(dia, calendar.monthrange(year, month)[1])).isoformat()


def test_requiere_token(client):
    assert client.get("/transactions/monthly").status_code == 401


def test_por_defecto_devuelve_seis_meses(client):
    h = _auth(client, "m1@test.com")
    body = client.get("/transactions/monthly", headers=h).json()
    assert len(body["months"]) == 6


def test_la_serie_termina_en_el_mes_actual_y_va_en_orden(client):
    h = _auth(client, "m2@test.com")
    meses = [m["month"] for m in client.get("/transactions/monthly", headers=h).json()["months"]]
    assert meses[-1] == _mes(0), "el último es el mes actual"
    assert meses[0] == _mes(-5), "el primero es cinco meses atrás"
    assert meses == sorted(meses), "del más viejo al más nuevo"


def test_usuario_sin_movimientos_devuelve_todo_en_cero(client):
    h = _auth(client, "m3@test.com")
    body = client.get("/transactions/monthly?months=3", headers=h).json()
    assert len(body["months"]) == 3
    for mes in body["months"]:
        assert mes["income"] == 0 and mes["expense"] == 0 and mes["balance"] == 0


def test_los_meses_sin_movimientos_van_en_cero_sin_huecos(client):
    """El gráfico necesita la serie completa: un mes vacío no se omite."""
    h = _auth(client, "m4@test.com")
    _tx(client, h, "income", 100000, _dia(-3))
    _tx(client, h, "expense", 40000, _dia(0))

    meses = client.get("/transactions/monthly?months=4", headers=h).json()["months"]
    assert len(meses) == 4
    por_etiqueta = {m["month"]: m for m in meses}
    assert por_etiqueta[_mes(-3)]["income"] == 100000
    assert por_etiqueta[_mes(-2)]["balance"] == 0
    assert por_etiqueta[_mes(-1)]["balance"] == 0
    assert por_etiqueta[_mes(0)]["expense"] == 40000


def test_suma_ingresos_y_gastos_del_mismo_mes(client):
    h = _auth(client, "m5@test.com")
    _tx(client, h, "income", 450000, _dia(-1, 5))
    _tx(client, h, "income", 50000, _dia(-1, 20))
    _tx(client, h, "expense", 120000, _dia(-1, 25))

    mes = next(
        m
        for m in client.get("/transactions/monthly?months=3", headers=h).json()["months"]
        if m["month"] == _mes(-1)
    )
    assert mes["income"] == 500000
    assert mes["expense"] == 120000
    assert mes["balance"] == 380000


def test_no_incluye_movimientos_fuera_de_la_ventana(client):
    h = _auth(client, "m6@test.com")
    _tx(client, h, "income", 999999, _dia(-8))  # fuera de una ventana de 3
    _tx(client, h, "income", 1000, _dia(0))

    body = client.get("/transactions/monthly?months=3", headers=h).json()
    assert sum(m["income"] for m in body["months"]) == 1000


def test_ventana_configurable(client):
    h = _auth(client, "m7@test.com")
    for n in (1, 12, 24):
        body = client.get(f"/transactions/monthly?months={n}", headers=h).json()
        assert len(body["months"]) == n
        assert body["months"][-1]["month"] == _mes(0)


def test_meses_fuera_de_rango_devuelve_422(client):
    h = _auth(client, "m8@test.com")
    assert client.get("/transactions/monthly?months=0", headers=h).status_code == 422
    assert client.get("/transactions/monthly?months=25", headers=h).status_code == 422
    assert client.get("/transactions/monthly?months=abc", headers=h).status_code == 422


def test_la_ventana_cruza_el_cambio_de_ano(client):
    """Una ventana de 24 meses pasa por al menos un diciembre-enero sin repetir ni saltar."""
    h = _auth(client, "m9@test.com")
    meses = [m["month"] for m in client.get("/transactions/monthly?months=24", headers=h).json()["months"]]
    assert len(set(meses)) == 24, "no hay meses repetidos"
    assert all(1 <= int(m[5:]) <= 12 for m in meses), "no hay un mes 00 ni 13"


def test_no_mezcla_datos_de_otro_usuario(client):
    h1 = _auth(client, "m10a@test.com")
    h2 = _auth(client, "m10b@test.com")
    _tx(client, h1, "income", 700000, _dia(0))

    body = client.get("/transactions/monthly", headers=h2).json()
    assert sum(m["income"] for m in body["months"]) == 0


def test_la_ruta_monthly_no_choca_con_la_de_id(client):
    """/transactions/monthly no debe interpretarse como /transactions/{id}."""
    h = _auth(client, "m11@test.com")
    assert client.get("/transactions/monthly", headers=h).status_code == 200
    assert client.get("/transactions/999999", headers=h).status_code == 404


def test_el_mes_actual_coincide_con_el_resumen(client):
    """La serie y GET /summary tienen que contar lo mismo para el mes actual."""
    h = _auth(client, "m12@test.com")
    _tx(client, h, "income", 300000, _dia(0, 3))
    _tx(client, h, "expense", 75000, _dia(0, 10))

    resumen = client.get("/transactions/summary", headers=h).json()["month"]
    serie = client.get("/transactions/monthly", headers=h).json()["months"][-1]
    assert serie["month"] == resumen["month"]
    assert serie["income"] == resumen["income"]
    assert serie["expense"] == resumen["expense"]
    assert serie["balance"] == resumen["balance"]
