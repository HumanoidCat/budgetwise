"""Módulo goals — capa HTTP. Las historias del backlog implementan los endpoints."""
from fastapi import APIRouter

router = APIRouter(prefix="/goals", tags=["goals"])


@router.get("/ping")
def ping() -> dict:
    """Placeholder del módulo goals (se reemplaza al implementar las HU)."""
    return {"module": "goals", "status": "pendiente de implementar"}
