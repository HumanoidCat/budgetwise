"""HU-16 — Observabilidad de BudgetWise.

Cuatro capacidades, pensadas para la rúbrica (monitoreo, trazabilidad, detección de fallos,
seguimiento del comportamiento):

- Monitoreo:        métricas Prometheus en GET /metrics (peticiones, latencia, errores).
- Trazabilidad:     cada petición recibe un X-Request-ID (se respeta si el cliente lo manda)
                    que viaja en la respuesta y en todas las líneas de log de esa petición.
- Detección fallos: GET /health verifica la conexión a la base de datos y devuelve 503 si
                    falla; las excepciones no controladas se registran con su request-id.
- Comportamiento:   logs JSON estructurados (fáciles de filtrar en Render/Grafana/Datadog).
"""
import json
import logging
import time
import uuid
from contextvars import ContextVar

from fastapi import FastAPI, Request
from fastapi.responses import JSONResponse
from prometheus_client import CONTENT_TYPE_LATEST, Counter, Gauge, Histogram, generate_latest
from sqlalchemy import text
from starlette.responses import Response

from app.core.database import engine

# --- Trazabilidad -----------------------------------------------------------------------

request_id_ctx: ContextVar[str] = ContextVar("request_id", default="-")


class JsonFormatter(logging.Formatter):
    """Una línea JSON por evento, con el request_id de la petición en curso."""

    def format(self, record: logging.LogRecord) -> str:
        payload = {
            "time": self.formatTime(record, "%Y-%m-%dT%H:%M:%S"),
            "level": record.levelname,
            "logger": record.name,
            "request_id": request_id_ctx.get(),
            "msg": record.getMessage(),
        }
        for key in ("method", "path", "status", "elapsed_ms"):
            if hasattr(record, key):
                payload[key] = getattr(record, key)
        if record.exc_info:
            payload["exception"] = self.formatException(record.exc_info)
        return json.dumps(payload, ensure_ascii=False)


def configure_logging() -> None:
    handler = logging.StreamHandler()
    handler.setFormatter(JsonFormatter())
    root = logging.getLogger()
    root.handlers.clear()
    root.addHandler(handler)
    root.setLevel(logging.INFO)
    # uvicorn ya imprime su propia línea de acceso; evitamos duplicar.
    logging.getLogger("uvicorn.access").disabled = True


logger = logging.getLogger("budgetwise")

# --- Monitoreo (Prometheus) -------------------------------------------------------------

REQUESTS = Counter(
    "budgetwise_http_requests_total",
    "Peticiones HTTP atendidas",
    ["method", "path", "status"],
)
LATENCY = Histogram(
    "budgetwise_http_request_duration_seconds",
    "Latencia de las peticiones HTTP",
    ["method", "path"],
    buckets=(0.005, 0.01, 0.025, 0.05, 0.1, 0.25, 0.5, 1, 2.5, 5),
)
IN_PROGRESS = Gauge("budgetwise_http_requests_in_progress", "Peticiones en curso")
ERRORS = Counter("budgetwise_unhandled_exceptions_total", "Excepciones no controladas", ["path"])
DB_UP = Gauge("budgetwise_database_up", "1 si la base de datos responde, 0 si no")


def _route_template(request: Request) -> str:
    """Usa la plantilla de la ruta (/transactions/{transaction_id}) para no explotar cardinalidad."""
    route = request.scope.get("route")
    return getattr(route, "path", request.url.path)


# --- Detección de fallos ----------------------------------------------------------------

def check_database() -> bool:
    try:
        with engine.connect() as conn:
            conn.execute(text("SELECT 1"))
        DB_UP.set(1)
        return True
    except Exception:  # noqa: BLE001 — cualquier fallo de conexión cuenta como caída
        logger.exception("Fallo al conectar con la base de datos")
        DB_UP.set(0)
        return False


# --- Registro en la app -----------------------------------------------------------------

def setup_observability(app: FastAPI) -> None:
    configure_logging()

    @app.middleware("http")
    async def observe(request: Request, call_next):
        request_id = request.headers.get("X-Request-ID") or uuid.uuid4().hex[:12]
        token = request_id_ctx.set(request_id)
        request.state.request_id = request_id  # visible para el handler de excepciones
        IN_PROGRESS.inc()
        start = time.perf_counter()
        try:
            response = await call_next(request)
            elapsed = time.perf_counter() - start
            path = _route_template(request)
            if path != "/metrics":
                REQUESTS.labels(request.method, path, response.status_code).inc()
                LATENCY.labels(request.method, path).observe(elapsed)
                logger.info(
                    "request",
                    extra={
                        "method": request.method,
                        "path": request.url.path,
                        "status": response.status_code,
                        "elapsed_ms": round(elapsed * 1000, 1),
                    },
                )
            response.headers["X-Request-ID"] = request_id
            return response
        finally:
            IN_PROGRESS.dec()
            request_id_ctx.reset(token)

    @app.exception_handler(Exception)
    async def unhandled_exception_handler(request: Request, exc: Exception):
        # Este handler corre fuera del middleware (ServerErrorMiddleware), así que el
        # ContextVar ya se reinició: recuperamos el id desde request.state.
        request_id = getattr(request.state, "request_id", None) or "-"
        token = request_id_ctx.set(request_id)
        try:
            ERRORS.labels(path=_route_template(request)).inc()
            logger.exception("Excepción no controlada en %s %s", request.method, request.url.path)
        finally:
            request_id_ctx.reset(token)
        return JSONResponse(
            status_code=500,
            content={"detail": "Error interno del servidor", "request_id": request_id},
            headers={"X-Request-ID": request_id},
        )

    @app.get("/metrics", tags=["observabilidad"], include_in_schema=False)
    def metrics() -> Response:
        return Response(generate_latest(), media_type=CONTENT_TYPE_LATEST)

    @app.get("/health", tags=["observabilidad"])
    def health() -> JSONResponse:
        db_ok = check_database()
        body = {
            "status": "ok" if db_ok else "degraded",
            "service": "budgetwise-api",
            "checks": {"database": "ok" if db_ok else "down"},
        }
        return JSONResponse(status_code=200 if db_ok else 503, content=body)
