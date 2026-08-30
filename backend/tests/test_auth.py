"""Pruebas de HU-01 (registro) y HU-02 (login)."""

VALID = {"email": "ana@test.com", "password": "clave12345", "name": "Ana"}


def _register(client, **overrides):
    return client.post("/auth/register", json={**VALID, **overrides})


class TestRegistro:
    def test_registro_exitoso_devuelve_201_y_token(self, client):
        resp = _register(client)
        assert resp.status_code == 201
        body = resp.json()
        assert body["access_token"]
        assert body["token_type"] == "bearer"
        assert body["user"]["email"] == VALID["email"]
        assert "password" not in str(body)

    def test_email_duplicado_devuelve_409(self, client):
        _register(client, email="dup@test.com")
        resp = _register(client, email="dup@test.com")
        assert resp.status_code == 409

    def test_password_corta_devuelve_422(self, client):
        resp = _register(client, email="corta@test.com", password="corta")
        assert resp.status_code == 422

    def test_email_invalido_devuelve_422(self, client):
        resp = _register(client, email="no-es-un-email")
        assert resp.status_code == 422


class TestLogin:
    def test_login_correcto_devuelve_token(self, client):
        _register(client, email="login@test.com")
        resp = client.post(
            "/auth/login", json={"email": "login@test.com", "password": VALID["password"]}
        )
        assert resp.status_code == 200
        assert resp.json()["access_token"]

    def test_password_incorrecta_devuelve_401(self, client):
        _register(client, email="mala@test.com")
        resp = client.post("/auth/login", json={"email": "mala@test.com", "password": "incorrecta1"})
        assert resp.status_code == 401

    def test_usuario_inexistente_devuelve_401(self, client):
        resp = client.post("/auth/login", json={"email": "nadie@test.com", "password": "loquesea1"})
        assert resp.status_code == 401


class TestTokenProtege:
    def test_me_sin_token_devuelve_401(self, client):
        assert client.get("/auth/me").status_code == 401

    def test_me_con_token_invalido_devuelve_401(self, client):
        resp = client.get("/auth/me", headers={"Authorization": "Bearer token-falso"})
        assert resp.status_code == 401

    def test_me_con_token_valido_devuelve_usuario(self, client):
        token = _register(client, email="me@test.com").json()["access_token"]
        resp = client.get("/auth/me", headers={"Authorization": f"Bearer {token}"})
        assert resp.status_code == 200
        assert resp.json()["email"] == "me@test.com"
