from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import RedirectResponse

from app.core.observability import setup_observability
from app.modules.ai.router import router as ai_router
from app.modules.auth.router import router as auth_router
from app.modules.budgets.router import router as budgets_router
from app.modules.categories.router import router as categories_router
from app.modules.goals.router import router as goals_router
from app.modules.transactions.router import router as transactions_router

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

# HU-16: logs JSON con request-id, métricas Prometheus (/metrics), /health con chequeo de BD
# y manejo de excepciones no controladas. Ver app/core/observability.py y docs/observability.md.
setup_observability(app)

# El esquema de la BD lo gestiona Alembic (S0-6): el contenedor ejecuta
# `alembic upgrade head` antes de arrancar uvicorn (ver backend/Dockerfile).
# En pruebas, tests/conftest.py crea las tablas con Base.metadata.create_all.


@app.get("/", include_in_schema=False)
def root() -> RedirectResponse:
    """La raíz redirige a la documentación interactiva."""
    return RedirectResponse(url="/docs")


app.include_router(auth_router)
app.include_router(categories_router)
app.include_router(transactions_router)
app.include_router(goals_router)
app.include_router(budgets_router)
app.include_router(ai_router)
