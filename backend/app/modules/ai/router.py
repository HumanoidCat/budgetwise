"""Módulo ai — HU-14: recomendaciones financieras básicas."""
from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.models.models import User
from app.modules.ai import service
from app.modules.ai.schemas import RecommendationsOut
from app.modules.auth.dependencies import get_current_user

router = APIRouter(prefix="/ai", tags=["ai"])


@router.get("/recommendations", response_model=RecommendationsOut)
def get_recommendations(
    month: str | None = Query(default=None, description="YYYY-MM; por defecto el mes actual"),
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> RecommendationsOut:
    """Recomendaciones personalizadas según los datos reales del usuario.

    `source` indica cómo se redactaron: "llm" si hay API key configurada y la
    llamada funcionó; "rules" (plantillas) en cualquier otro caso.
    """
    return service.recommendations(db, user.id, month)
