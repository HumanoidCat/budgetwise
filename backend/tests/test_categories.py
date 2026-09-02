"""Pruebas de HU-03 (CRUD de categorías y categorías por defecto)."""
from datetime import date

from app.core.database import SessionLocal
from app.models.models import Budget, Transaction, TransactionType
from app.modules.categories.service import DEFAULT_CATEGORIES


def _auth(client, email):
    token = client.post(
        "/auth/register", json={"email": email, "password": "clave12345", "name": "T"}
    ).json()["access_token"]
    return {"Authorization": f"Bearer {token}"}


def _user_id(client, headers):
    return client.get("/auth/me", headers=headers).json()["id"]


def _crear(client, headers, name="Gimnasio", icon="dumbbell"):
    return client.post("/categories", json={"name": name, "icon": icon}, headers=headers)


def _seed_transaccion(user_id, category_id):
    """Inserta un gasto directo en BD: transactions (HU-04) aún no está expuesto."""
    with SessionLocal() as db:
        db.add(
            Transaction(
                user_id=user_id,
                category_id=category_id,
                type=TransactionType.expense,
                amount=1000,
                date=date.today(),
            )
        )
        db.commit()


def _seed_presupuesto(user_id, category_id):
    with SessionLocal() as db:
        db.add(Budget(user_id=user_id, category_id=category_id, monthly_limit=500))
        db.commit()


# --- categorías por defecto ---

def test_usuario_nuevo_recibe_las_categorias_por_defecto(client):
    h = _auth(client, "c1@test.com")
    resp = client.get("/categories", headers=h)
    assert resp.status_code == 200
    assert {c["name"] for c in resp.json()} == {name for name, _ in DEFAULT_CATEGORIES}


def test_categorias_vienen_ordenadas_por_nombre(client):
    h = _auth(client, "c2@test.com")
    nombres = [c["name"] for c in client.get("/categories", headers=h).json()]
    assert nombres == sorted(nombres)


# --- autenticación ---

def test_requiere_token(client):
    assert client.get("/categories").status_code == 401
    assert client.post("/categories", json={"name": "X"}).status_code == 401
    assert client.get("/categories/1").status_code == 401
    assert client.patch("/categories/1", json={"name": "X"}).status_code == 401
    assert client.delete("/categories/1").status_code == 401


def test_token_invalido_devuelve_401(client):
    assert client.get("/categories", headers={"Authorization": "Bearer falso"}).status_code == 401


# --- crear ---

def test_crear_devuelve_201_y_la_categoria(client):
    h = _auth(client, "c3@test.com")
    resp = _crear(client, h)
    assert resp.status_code == 201
    body = resp.json()
    assert body["name"] == "Gimnasio" and body["icon"] == "dumbbell"
    assert isinstance(body["id"], int)


def test_icono_por_defecto_cuando_no_se_envia(client):
    h = _auth(client, "c4@test.com")
    resp = client.post("/categories", json={"name": "Mascotas"}, headers=h)
    assert resp.json()["icon"] == "tag"


def test_recorta_espacios_sobrantes(client):
    h = _auth(client, "c5@test.com")
    assert _crear(client, h, name="  Regalos  ").json()["name"] == "Regalos"


def test_nombre_duplicado_devuelve_409(client):
    h = _auth(client, "c6@test.com")
    _crear(client, h, name="Viajes")
    assert _crear(client, h, name="Viajes").status_code == 409


def test_duplicado_ignora_mayusculas(client):
    h = _auth(client, "c7@test.com")
    assert _crear(client, h, name="salario").status_code == 409


def test_nombre_vacio_devuelve_422(client):
    h = _auth(client, "c8@test.com")
    assert _crear(client, h, name="   ").status_code == 422
    assert _crear(client, h, name="x" * 81).status_code == 422
    assert client.post("/categories", json={"icon": "tag"}, headers=h).status_code == 422


# --- obtener ---

def test_obtener_una_categoria_propia(client):
    h = _auth(client, "c9@test.com")
    cid = _crear(client, h, name="Libros").json()["id"]
    resp = client.get(f"/categories/{cid}", headers=h)
    assert resp.status_code == 200 and resp.json()["name"] == "Libros"


def test_categoria_inexistente_devuelve_404(client):
    h = _auth(client, "c10@test.com")
    assert client.get("/categories/999999", headers=h).status_code == 404


def test_categoria_de_otro_usuario_devuelve_404(client):
    h1 = _auth(client, "c11a@test.com")
    h2 = _auth(client, "c11b@test.com")
    cid = _crear(client, h1, name="Privada").json()["id"]
    assert client.get(f"/categories/{cid}", headers=h2).status_code == 404


# --- actualizar ---

def test_cambiar_solo_el_icono_conserva_el_nombre(client):
    h = _auth(client, "c12@test.com")
    cid = _crear(client, h, name="Cine", icon="movie").json()["id"]
    body = client.patch(f"/categories/{cid}", json={"icon": "ticket"}, headers=h).json()
    assert body == {"id": cid, "name": "Cine", "icon": "ticket"}


def test_renombrar_a_uno_existente_devuelve_409(client):
    h = _auth(client, "c13@test.com")
    _crear(client, h, name="Uno")
    cid = _crear(client, h, name="Dos").json()["id"]
    assert client.patch(f"/categories/{cid}", json={"name": "Uno"}, headers=h).status_code == 409


def test_guardar_el_mismo_nombre_no_da_conflicto(client):
    h = _auth(client, "c14@test.com")
    cid = _crear(client, h, name="Igual").json()["id"]
    assert client.patch(f"/categories/{cid}", json={"name": "Igual"}, headers=h).status_code == 200


def test_actualizar_categoria_de_otro_usuario_devuelve_404(client):
    h1 = _auth(client, "c15a@test.com")
    h2 = _auth(client, "c15b@test.com")
    cid = _crear(client, h1, name="Ajena").json()["id"]
    assert client.patch(f"/categories/{cid}", json={"name": "Hack"}, headers=h2).status_code == 404


# --- eliminar ---

def test_borrar_sin_uso_devuelve_204(client):
    h = _auth(client, "c16@test.com")
    cid = _crear(client, h, name="Temporal").json()["id"]
    assert client.delete(f"/categories/{cid}", headers=h).status_code == 204
    assert client.get(f"/categories/{cid}", headers=h).status_code == 404


def test_borrar_con_transacciones_devuelve_409(client):
    h = _auth(client, "c17@test.com")
    cid = _crear(client, h, name="Con movimientos").json()["id"]
    _seed_transaccion(_user_id(client, h), cid)
    assert client.delete(f"/categories/{cid}", headers=h).status_code == 409
    assert client.get(f"/categories/{cid}", headers=h).status_code == 200


def test_reasignando_las_transacciones_se_puede_borrar(client):
    h = _auth(client, "c18@test.com")
    origen = _crear(client, h, name="Origen").json()["id"]
    destino = _crear(client, h, name="Destino").json()["id"]
    _seed_transaccion(_user_id(client, h), origen)

    assert client.delete(f"/categories/{origen}?reassign_to={destino}", headers=h).status_code == 204
    assert client.get(f"/categories/{origen}", headers=h).status_code == 404
    with SessionLocal() as db:
        movidas = db.query(Transaction).filter(Transaction.category_id == destino).count()
    assert movidas == 1


def test_reasignar_a_si_misma_devuelve_400(client):
    h = _auth(client, "c19@test.com")
    cid = _crear(client, h, name="Bucle").json()["id"]
    assert client.delete(f"/categories/{cid}?reassign_to={cid}", headers=h).status_code == 400


def test_reasignar_a_una_inexistente_devuelve_404(client):
    h = _auth(client, "c20@test.com")
    cid = _crear(client, h, name="Huerfana").json()["id"]
    assert client.delete(f"/categories/{cid}?reassign_to=999999", headers=h).status_code == 404


def test_borrar_con_presupuesto_asociado_devuelve_409(client):
    h = _auth(client, "c21@test.com")
    cid = _crear(client, h, name="Con presupuesto").json()["id"]
    _seed_presupuesto(_user_id(client, h), cid)
    resp = client.delete(f"/categories/{cid}", headers=h)
    assert resp.status_code == 409
    assert "presupuesto" in resp.json()["detail"].lower()


def test_borrar_categoria_de_otro_usuario_devuelve_404(client):
    h1 = _auth(client, "c22a@test.com")
    h2 = _auth(client, "c22b@test.com")
    cid = _crear(client, h1, name="No tuya").json()["id"]
    assert client.delete(f"/categories/{cid}", headers=h2).status_code == 404


# --- aislamiento ---

def test_cada_usuario_ve_solo_sus_categorias(client):
    h1 = _auth(client, "c23a@test.com")
    h2 = _auth(client, "c23b@test.com")
    _crear(client, h1, name="Solo mia")
    assert "Solo mia" not in {c["name"] for c in client.get("/categories", headers=h2).json()}
