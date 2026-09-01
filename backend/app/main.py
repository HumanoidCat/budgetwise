import logging
import time
import uuid

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware

from app.modules.ai.router import router as ai_router
from app.modules.auth.router import router as auth_router
from app.modules.budgets.router import router as budgets_router
from app.modules.categories.router import router as categories_router
from app.modules.goals.router import router as goals_router
from app.modules.transactions.router import router as transactions_router

logging.basicConfig(
    level=logging.INFO,
    format='{"time":"%(asctime)s","level":"%(levelname)s","logger":"%(name)s","msg":"%(message)s"}',
)
logger = logging.getLogger("budgetwise")

app = FastAPI(
    title="BudgetWise API",
    description="MVP de gestión de presupuesto personal — Ingeniería de Software II",
    version="0.1.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # MVP: restringir en producción
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.middleware("http")
async def request_id_and_timing(request: Request, call_next):
    """Observabilidad básica: request-id + latencia en cada log (HU-16 la amplía)."""
    request_id = str(uuid.uuid4())[:8]
    start = time.perf_counter()
    response = await call_next(request)
    elapsed_ms = (time.perf_counter() - start) * 1000
    logger.info(
        "request_id=%s method=%s path=%s status=%s elapsed_ms=%.1f",
        request_id, request.method, request.url.path, response.status_code, elapsed_ms,
    )
    response.headers["X-Request-ID"] = request_id
    return response


# El esquema de la BD lo gestiona Alembic (S0-6): el contenedor ejecuta
# `alembic upgrade head` antes de arrancar uvicorn (ver backend/Dockerfile).
# En pruebas, tests/conftest.py crea las tablas con Base.metadata.create_all.


@app.get("/health", tags=["observabilidad"])
def health() -> dict:
    return {"status": "ok", "service": "budgetwise-api"}


app.include_router(auth_router)
app.include_router(categories_router)
app.include_router(transactions_router)
app.include_router(goals_router)
app.include_router(budgets_router)
app.include_router(ai_router)
