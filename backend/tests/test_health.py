def test_health_ok(client):
    resp = client.get("/health")
    assert resp.status_code == 200
    body = resp.json()
    assert body["status"] == "ok"
    assert "X-Request-ID".lower() in {k.lower() for k in resp.headers}


def test_modules_registered(client):
    """Todos los módulos del monolito responden (placeholders del Sprint 0)."""
    for module in ["categories", "transactions", "goals", "ai"]:
        resp = client.get(f"/{module}/ping")
        assert resp.status_code == 200, f"módulo {module} no registrado"
    # módulos ya implementados: responden 401 sin token, no 404
    assert client.get("/auth/me").status_code == 401
    assert client.get("/budgets/status").status_code == 401
