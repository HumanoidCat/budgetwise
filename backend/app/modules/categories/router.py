"""Módulo categories — capa HTTP. Las historias del backlog implementan los endpoints."""
from fastapi import APIRouter

router = APIRouter(prefix="/categories", tags=["categories"])


@router.get("/ping")
def ping() -> dict:
    """Placeholder del módulo categories (se reemplaza al implementar las HU)."""
    return {"module": "categories", "status": "pendiente de implementar"}
