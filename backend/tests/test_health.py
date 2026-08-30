def test_health_ok(client):
    resp = client.get("/health")
    assert resp.status_code == 200
    body = resp.json()
    assert body["status"] == "ok"
    assert "X-Request-ID".lower() in {k.lower() for k in resp.headers}


def test_modules_registered(client):
    """Todos los módulos del monolito responden (placeholders del Sprint 0)."""
    for module in ["categories", "transactions", "goals", "budgets", "ai"]:
        resp = client.get(f"/{module}/ping")
        assert resp.status_code == 200, f"módulo {module} no registrado"
    # auth ya está implementado (HU-01/02): responde 401 sin token, no 404
    assert client.get("/auth/me").status_code == 401
