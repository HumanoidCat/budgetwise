"""Pruebas de HU-14 (recomendaciones de IA — motor de reglas)."""
from datetime import date

from app.core.database import SessionLocal
from app.models.models import Category, Goal, Transaction, TransactionType


def _auth(client, email):
    token = client.post(
        "/auth/register", json={"email": email, "password": "clave12345", "name": "T"}
    ).json()["access_token"]
    return {"Authorization": f"Bearer {token}"}


def _user_id(client, headers):
    return client.get("/auth/me", headers=headers).json()["id"]


def _seed(user_id, *, incomes=(), expenses=(), category="Comida", uncategorized=()):
    with SessionLocal() as db:
        cat = Category(user_id=user_id, name=category)
        db.add(cat)
        db.flush()
        today = date.today()
        for amount in incomes:
            db.add(Transaction(user_id=user_id, type=TransactionType.income, amount=amount, date=today))
        for amount in expenses:
            db.add(Transaction(
                user_id=user_id, category_id=cat.id,
                type=TransactionType.expense, amount=amount, date=today,
            ))
        for amount in uncategorized:
            db.add(Transaction(user_id=user_id, type=TransactionType.expense, amount=amount, date=today))
        db.commit()
        return cat.id


def _types(body):
    return [r["type"] for r in body["recommendations"]]


def test_requiere_token(client):
    assert client.get("/ai/recommendations").status_code == 401


def test_sin_movimientos_invita_a_registrar(client):
    h = _auth(client, "ai1@test.com")
    body = client.get("/ai/recommendations", headers=h).json()
    assert body["source"] == "rules"
    assert "sin_movimientos" in _types(body)


def test_mes_en_negativo_es_critical(client):
    h = _auth(client, "ai2@test.com")
    _seed(_user_id(client, h), incomes=[100], expenses=[300])
    body = client.get("/ai/recommendations", headers=h).json()
    assert "mes_en_negativo" in _types(body)
    assert body["recommendations"][0]["severity"] == "critical"  # critical va primero


def test_presupuesto_excedido_genera_recomendacion(client):
    h = _auth(client, "ai3@test.com")
    uid = _user_id(client, h)
    cat_id = _seed(uid, incomes=[5000], expenses=[1200])
    client.put("/budgets", json={"category_id": cat_id, "monthly_limit": 1000}, headers=h)
    types = _types(client.get("/ai/recommendations", headers=h).json())
    assert "presupuesto_excedido" in types


def test_sin_presupuesto_sugiere_crearlo(client):
    h = _auth(client, "ai4@test.com")
    _seed(_user_id(client, h), incomes=[1000], expenses=[100])
    types = _types(client.get("/ai/recommendations", headers=h).json())
    assert "sin_presupuesto" in types


def test_gastos_sin_categoria(client):
    h = _auth(client, "ai5@test.com")
    _seed(_user_id(client, h), incomes=[1000], expenses=[100], uncategorized=[200])
    types = _types(client.get("/ai/recommendations", headers=h).json())
    assert "gastos_sin_categoria" in types


def test_meta_rezagada(client):
    h = _auth(client, "ai6@test.com")
    uid = _user_id(client, h)
    _seed(uid, incomes=[1000], expenses=[100])
    with SessionLocal() as db:
        db.add(Goal(user_id=uid, name="Viaje", target_amount=100000, saved_amount=5000))
        db.commit()
    types = _types(client.get("/ai/recommendations", headers=h).json())
    assert "meta_rezagada" in types


def test_maximo_cinco_recomendaciones(client):
    h = _auth(client, "ai7@test.com")
    uid = _user_id(client, h)
    cat_id = _seed(uid, incomes=[100], expenses=[500], uncategorized=[400])
    client.put("/budgets", json={"category_id": cat_id, "monthly_limit": 100}, headers=h)
    client.put("/budgets", json={"category_id": None, "monthly_limit": 200}, headers=h)
    with SessionLocal() as db:
        db.add(Goal(user_id=uid, name="Fondo", target_amount=50000, saved_amount=0))
        db.commit()
    body = client.get("/ai/recommendations", headers=h).json()
    assert len(body["recommendations"]) <= 5


def test_mes_invalido_devuelve_422(client):
    h = _auth(client, "ai8@test.com")
    assert client.get("/ai/recommendations?month=nope", headers=h).status_code == 422
