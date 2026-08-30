"""Módulo ai — capa HTTP. Las historias del backlog implementan los endpoints."""
from fastapi import APIRouter

router = APIRouter(prefix="/ai", tags=["ai"])


@router.get("/ping")
def ping() -> dict:
    """Placeholder del módulo ai (se reemplaza al implementar las HU)."""
    return {"module": "ai", "status": "pendiente de implementar"}
