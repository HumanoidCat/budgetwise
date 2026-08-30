"""Módulo budgets — capa HTTP. Las historias del backlog implementan los endpoints."""
from fastapi import APIRouter

router = APIRouter(prefix="/budgets", tags=["budgets"])


@router.get("/ping")
def ping() -> dict:
    """Placeholder del módulo budgets (se reemplaza al implementar las HU)."""
    return {"module": "budgets", "status": "pendiente de implementar"}
