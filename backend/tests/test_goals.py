"""Pruebas de HU-10 (metas de ahorro)."""


def _auth(client, email):
    token = client.post(
        "/auth/register", json={"email": email, "password": "clave12345", "name": "T"}
    ).json()["access_token"]
    return {"Authorization": f"Bearer {token}"}


def _new(client, headers, **overrides):
    body = {"name": "Fondo de emergencia", "target_amount": 1000000, "due_date": None}
    body.update(overrides)
    return client.post("/goals", json=body, headers=headers)


def _aportar(client, headers, goal_id, amount):
    return client.post(
        f"/goals/{goal_id}/contributions", json={"amount": amount}, headers=headers
    )


def test_requiere_token(client):
    assert client.get("/goals").status_code == 401
    assert client.post("/goals", json={}).status_code == 401


def test_crear_meta_arranca_en_cero(client):
    h = _auth(client, "g1@test.com")
    resp = _new(client, h, name="Viaje", target_amount=300000, due_date="2026-12-31")
    assert resp.status_code == 201

    body = resp.json()
    assert body["name"] == "Viaje"
    assert body["target_amount"] == 300000
    assert body["saved_amount"] == 0
    assert body["due_date"] == "2026-12-31"
    assert body["progress"] == 0
    assert body["remaining"] == 300000
    assert body["completed"] is False


def test_fecha_limite_es_opcional(client):
    h = _auth(client, "g2@test.com")
    assert _new(client, h, due_date=None).json()["due_date"] is None


def test_objetivo_debe_ser_mayor_a_cero(client):
    h = _auth(client, "g3@test.com")
    assert _new(client, h, target_amount=0).status_code == 422
    assert _new(client, h, target_amount=-5000).status_code == 422


def test_nombre_no_puede_ir_vacio(client):
    h = _auth(client, "g4@test.com")
    assert _new(client, h, name="").status_code == 422


def test_no_se_puede_mandar_saldo_ahorrado_al_crear(client):
    """saved_amount no es parte del contrato de alta: si llega, se ignora."""
    h = _auth(client, "g5@test.com")
    body = client.post(
        "/goals",
        json={"name": "Trampa", "target_amount": 100000, "saved_amount": 99999},
        headers=h,
    ).json()
    assert body["saved_amount"] == 0


def test_aporte_actualiza_el_avance(client):
    h = _auth(client, "g6@test.com")
    goal_id = _new(client, h, target_amount=1000000).json()["id"]

    resp = _aportar(client, h, goal_id, 620000)
    assert resp.status_code == 201

    body = resp.json()
    assert body["saved_amount"] == 620000
    assert body["progress"] == 62.0
    assert body["remaining"] == 380000
    assert body["completed"] is False


def test_los_aportes_se_acumulan(client):
    h = _auth(client, "g7@test.com")
    goal_id = _new(client, h, target_amount=100000).json()["id"]
    _aportar(client, h, goal_id, 30000)
    _aportar(client, h, goal_id, 20000)
    body = _aportar(client, h, goal_id, 10000).json()
    assert body["saved_amount"] == 60000 and body["progress"] == 60.0


def test_aporte_debe_ser_mayor_a_cero(client):
    h = _auth(client, "g8@test.com")
    goal_id = _new(client, h).json()["id"]
    assert _aportar(client, h, goal_id, 0).status_code == 422
    assert _aportar(client, h, goal_id, -1000).status_code == 422


def test_meta_completada(client):
    h = _auth(client, "g9@test.com")
    goal_id = _new(client, h, target_amount=50000).json()["id"]
    body = _aportar(client, h, goal_id, 50000).json()
    assert body["progress"] == 100.0
    assert body["remaining"] == 0
    assert body["completed"] is True


def test_se_puede_ahorrar_de_mas(client):
    """Pasarse del objetivo no es un error: progress supera 100 y remaining queda en 0."""
    h = _auth(client, "g10@test.com")
    goal_id = _new(client, h, target_amount=100000).json()["id"]
    body = _aportar(client, h, goal_id, 150000).json()
    assert body["progress"] == 150.0
    assert body["remaining"] == 0
    assert body["completed"] is True


def test_aporte_a_meta_inexistente(client):
    h = _auth(client, "g11@test.com")
    assert _aportar(client, h, 99999, 1000).status_code == 404


def test_listado_ordena_de_mayor_a_menor_avance(client):
    h = _auth(client, "g12@test.com")
    emergencia = _new(client, h, name="Fondo de emergencia", target_amount=1000000).json()["id"]
    viaje = _new(client, h, name="Viaje", target_amount=300000).json()["id"]
    compu = _new(client, h, name="Computadora", target_amount=500000).json()["id"]
    _aportar(client, h, emergencia, 620000)  # 62 %
    _aportar(client, h, viaje, 105000)  # 35 %
    _aportar(client, h, compu, 40000)  # 8 %

    metas = client.get("/goals", headers=h).json()
    assert [m["name"] for m in metas] == ["Fondo de emergencia", "Viaje", "Computadora"]
    assert [m["progress"] for m in metas] == [62.0, 35.0, 8.0]


def test_obtener_por_id(client):
    h = _auth(client, "g13@test.com")
    goal_id = _new(client, h, name="Casa").json()["id"]
    resp = client.get(f"/goals/{goal_id}", headers=h)
    assert resp.status_code == 200 and resp.json()["name"] == "Casa"
    assert client.get("/goals/99999", headers=h).status_code == 404


def test_actualizacion_parcial(client):
    h = _auth(client, "g14@test.com")
    goal_id = _new(client, h, name="Viaje", target_amount=300000).json()["id"]
    _aportar(client, h, goal_id, 150000)  # 50 %

    body = client.patch(f"/goals/{goal_id}", json={"name": "Viaje a Japón"}, headers=h).json()
    assert body["name"] == "Viaje a Japón"
    assert body["target_amount"] == 300000, "no se toca lo que no vino en el body"
    assert body["saved_amount"] == 150000


def test_cambiar_el_objetivo_recalcula_el_avance(client):
    h = _auth(client, "g15@test.com")
    goal_id = _new(client, h, target_amount=200000).json()["id"]
    _aportar(client, h, goal_id, 100000)  # 50 %

    body = client.patch(f"/goals/{goal_id}", json={"target_amount": 400000}, headers=h).json()
    assert body["progress"] == 25.0, "mismo ahorro, objetivo al doble"
    assert body["remaining"] == 300000


def test_quitar_la_fecha_limite_con_null(client):
    h = _auth(client, "g16@test.com")
    goal_id = _new(client, h, due_date="2026-12-31").json()["id"]
    body = client.patch(f"/goals/{goal_id}", json={"due_date": None}, headers=h).json()
    assert body["due_date"] is None


def test_no_se_puede_editar_lo_ahorrado_por_patch(client):
    """saved_amount no está en GoalUpdate: solo se mueve con aportes."""
    h = _auth(client, "g17@test.com")
    goal_id = _new(client, h, target_amount=100000).json()["id"]
    _aportar(client, h, goal_id, 20000)

    body = client.patch(f"/goals/{goal_id}", json={"saved_amount": 99999}, headers=h).json()
    assert body["saved_amount"] == 20000


def test_actualizar_con_objetivo_invalido(client):
    h = _auth(client, "g18@test.com")
    goal_id = _new(client, h).json()["id"]
    assert client.patch(f"/goals/{goal_id}", json={"target_amount": 0}, headers=h).status_code == 422


def test_eliminar(client):
    h = _auth(client, "g19@test.com")
    goal_id = _new(client, h).json()["id"]
    assert client.delete(f"/goals/{goal_id}", headers=h).status_code == 204
    assert client.get(f"/goals/{goal_id}", headers=h).status_code == 404
    assert client.delete(f"/goals/{goal_id}", headers=h).status_code == 404


def test_no_ve_ni_toca_metas_de_otro_usuario(client):
    h1 = _auth(client, "g20a@test.com")
    h2 = _auth(client, "g20b@test.com")
    ajena = _new(client, h1, name="Privada").json()["id"]

    assert client.get("/goals", headers=h2).json() == []
    assert client.get(f"/goals/{ajena}", headers=h2).status_code == 404
    assert client.patch(f"/goals/{ajena}", json={"name": "X"}, headers=h2).status_code == 404
    assert _aportar(client, h2, ajena, 1000).status_code == 404
    assert client.delete(f"/goals/{ajena}", headers=h2).status_code == 404
