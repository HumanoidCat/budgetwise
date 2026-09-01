"""Pruebas de HU-16 (observabilidad): métricas, trazabilidad, detección de fallos."""
from unittest.mock import patch

from fastapi.testclient import TestClient

from app.core import observability
from app.main import app


def test_health_reporta_base_de_datos_ok(client):
    resp = client.get("/health")
    assert resp.status_code == 200
    body = resp.json()
    assert body["status"] == "ok"
    assert body["checks"]["database"] == "ok"


def test_health_devuelve_503_si_la_base_falla(client):
    with patch.object(observability, "check_database", return_value=False):
        resp = client.get("/health")
    assert resp.status_code == 503
    assert resp.json()["status"] == "degraded"
    assert resp.json()["checks"]["database"] == "down"


def test_metrics_expone_formato_prometheus(client):
    client.get("/health")  # genera al menos una observación
    resp = client.get("/metrics")
    assert resp.status_code == 200
    assert resp.headers["content-type"].startswith("text/plain")
    text = resp.text
    assert "budgetwise_http_requests_total" in text
    assert "budgetwise_http_request_duration_seconds" in text
    assert "budgetwise_database_up" in text


def test_metrics_usa_plantilla_de_ruta_no_ids(client):
    """Las etiquetas deben ser /transactions/{transaction_id}, no /transactions/123 (cardinalidad)."""
    client.get("/transactions/123456")  # 401, pero igual se registra
    text = client.get("/metrics").text
    assert 'path="/transactions/{transaction_id}"' in text
    assert "/transactions/123456" not in text


def test_request_id_se_genera_y_devuelve(client):
    resp = client.get("/health")
    assert len(resp.headers["X-Request-ID"]) >= 8


def test_request_id_del_cliente_se_respeta(client):
    resp = client.get("/health", headers={"X-Request-ID": "traza-abc-123"})
    assert resp.headers["X-Request-ID"] == "traza-abc-123"


def test_excepcion_no_controlada_devuelve_500_con_request_id():
    @app.get("/_boom")
    def boom():
        raise RuntimeError("falla simulada")

    with TestClient(app, raise_server_exceptions=False) as c:
        resp = c.get("/_boom", headers={"X-Request-ID": "err-001"})
    assert resp.status_code == 500
    assert resp.json()["request_id"] == "err-001"
    assert resp.headers["X-Request-ID"] == "err-001"


def test_raiz_redirige_a_docs(client):
    resp = client.get("/", follow_redirects=False)
    assert resp.status_code == 307
    assert resp.headers["location"] == "/docs"
