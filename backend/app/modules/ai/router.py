"""Módulo ai — HU-14 (recomendaciones) y el asesor conversacional."""
from fastapi import APIRouter, Depends, Query
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.models.models import User
from app.modules.ai import asesor, service
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


class PreguntaIn(BaseModel):
    """Pregunta en lenguaje natural sobre la plata del usuario."""

    question: str = Field(
        min_length=2, max_length=300,
        examples=["¿me alcanza para unos tenis de 45 mil?"],
    )
    month: str | None = Field(default=None, description="YYYY-MM; por defecto el mes actual")


@router.post("/ask", response_model=asesor.RespuestaAsesorOut)
def ask(
    body: PreguntaIn,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> asesor.RespuestaAsesorOut:
    """El asesor: pregunta en español, respuesta anclada a los datos reales.

    Los números los calcula Python; el modelo solo redacta. Sin
    ANTHROPIC_API_KEY o si la llamada falla, responde igual con plantillas y lo
    dice en `source`. La app nunca se queda sin respuesta.
    """
    return asesor.responder(db, user.id, body.question, body.month)
