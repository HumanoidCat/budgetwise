"""Contratos del módulo ai (HU-14)."""
from typing import Literal

from pydantic import BaseModel

Severity = Literal["info", "warning", "critical"]


class RecommendationOut(BaseModel):
    """Una recomendación accionable sobre las finanzas del usuario."""

    type: str
    severity: Severity
    title: str
    message: str


class RecommendationsOut(BaseModel):
    month: str
    source: Literal["rules", "llm"]
    recommendations: list[RecommendationOut]
