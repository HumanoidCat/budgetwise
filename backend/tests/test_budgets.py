"""Pruebas de HU-11 (presupuestos y detección de sobrepaso)."""
from datetime import date

from app.core.database import SessionLocal
from app.models.models import Category, Transaction, TransactionType


def _auth(client, email):
    token = client.post(
        "/auth/register", json={"email": email, "password": "clave12345", "name": "T"}
    ).json()["access_token"]
    return {"Authorization": f"Bearer {token}"}


def _user_id(client, headers):
    return client.get("/auth/me", headers=headers).json()["id"]


def _seed(user_id, category_name="Comida", expenses=()):
    """Inserta una categoría y gastos directamente en BD (transactions es HU-04, aún no expuesto)."""
    with SessionLocal() as db:
        cat = Category(user_id=user_id, name=category_name)
        db.add(cat)
        db.flush()
        for amount in expenses:
            db.add(
                Transaction(
                    user_id=user_id,
                    category_id=cat.id,
                    type=TransactionType.expense,
                    amount=amount,
                    date=date.today(),
                )
            )
        db.commit()
        return cat.id


def test_requiere_token(client):
    assert client.get("/budgets/status").status_code == 401


def test_crear_presupuesto_global_sin_gastos(client):
    h = _auth(client, "b1@test.com")
    resp = client.put("/budgets", json={"category_id": None, "monthly_limit": 1000}, headers=h)
    assert resp.status_code == 200
    assert resp.json()["category_id"] is None

    status = client.get("/budgets/status", headers=h).json()
    assert status["has_alerts"] is False
    b = status["budgets"][0]
    assert b["spent"] == 0 and b["percent_used"] == 0 and b["status"] == "ok"


def test_upsert_actualiza_en_vez_de_duplicar(client):
    h = _auth(client, "b2@test.com")
    client.put("/budgets", json={"category_id": None, "monthly_limit": 500}, headers=h)
    client.put("/budgets", json={"category_id": None, "monthly_limit": 800}, headers=h)
    budgets = client.get("/budgets/status", headers=h).json()["budgets"]
    assert len(budgets) == 1 and budgets[0]["monthly_limit"] == 800


def test_estado_warning_al_80_por_ciento(client):
    h = _auth(client, "b3@test.com")
    cat_id = _seed(_user_id(client, h), expenses=[400, 420])  # 820 de 1000 = 82%
    client.put("/budgets", json={"category_id": cat_id, "monthly_limit": 1000}, headers=h)
    status = client.get("/budgets/status", headers=h).json()
    b = status["budgets"][0]
    assert b["spent"] == 820 and b["percent_used"] == 82.0 and b["status"] == "warning"
    assert b["category_name"] == "Comida"
    assert status["has_alerts"] is True and len(status["alerts"]) == 1


def test_estado_exceeded_al_pasar_100(client):
    h = _auth(client, "b4@test.com")
    cat_id = _seed(_user_id(client, h), expenses=[700, 500])  # 1200 de 1000
    client.put("/budgets", json={"category_id": cat_id, "monthly_limit": 1000}, headers=h)
    b = client.get("/budgets/status", headers=h).json()["budgets"][0]
    assert b["status"] == "exceeded" and b["remaining"] == -200


def test_presupuesto_global_suma_todas_las_categorias(client):
    h = _auth(client, "b5@test.com")
    uid = _user_id(client, h)
    _seed(uid, "Comida", expenses=[300])
    _seed(uid, "Transporte", expenses=[200])
    client.put("/budgets", json={"category_id": None, "monthly_limit": 1000}, headers=h)
    b = client.get("/budgets/status", headers=h).json()["budgets"][0]
    assert b["spent"] == 500 and b["status"] == "ok"


def test_categoria_inexistente_devuelve_404(client):
    h = _auth(client, "b6@test.com")
    resp = client.put("/budgets", json={"category_id": 99999, "monthly_limit": 100}, headers=h)
    assert resp.status_code == 404


def test_mes_invalido_devuelve_422(client):
    h = _auth(client, "b7@test.com")
    assert client.get("/budgets/status?month=2026-13", headers=h).status_code == 422
    assert client.get("/budgets/status?month=hola", headers=h).status_code == 422


def test_eliminar_presupuesto(client):
    h = _auth(client, "b8@test.com")
    bid = client.put("/budgets", json={"category_id": None, "monthly_limit": 100}, headers=h).json()["id"]
    assert client.delete(f"/budgets/{bid}", headers=h).status_code == 204
    assert client.get("/budgets/status", headers=h).json()["budgets"] == []
    assert client.delete(f"/budgets/{bid}", headers=h).status_code == 404


def test_no_ve_presupuestos_de_otro_usuario(client):
    h1 = _auth(client, "b9a@test.com")
    h2 = _auth(client, "b9b@test.com")
    client.put("/budgets", json={"category_id": None, "monthly_limit": 100}, headers=h1)
    assert client.get("/budgets/status", headers=h2).json()["budgets"] == []
