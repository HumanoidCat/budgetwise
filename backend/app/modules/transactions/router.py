"""Módulo transactions — capa HTTP. Las historias del backlog implementan los endpoints."""
from fastapi import APIRouter

router = APIRouter(prefix="/transactions", tags=["transactions"])


@router.get("/ping")
def ping() -> dict:
    """Placeholder del módulo transactions (se reemplaza al implementar las HU)."""
    return {"module": "transactions", "status": "pendiente de implementar"}
