"""Módulo auth — capa HTTP. Las historias del backlog implementan los endpoints."""
from fastapi import APIRouter

router = APIRouter(prefix="/auth", tags=["auth"])


@router.get("/ping")
def ping() -> dict:
    """Placeholder del módulo auth (se reemplaza al implementar las HU)."""
    return {"module": "auth", "status": "pendiente de implementar"}
