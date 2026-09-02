"""Contratos Pydantic del módulo goals (HU-10)."""
import datetime

from pydantic import BaseModel, Field


class GoalCreate(BaseModel):
    """Alta de una meta. El saldo ahorrado NO se manda acá: arranca en 0 y sube con aportes."""

    name: str = Field(min_length=1, max_length=120)
    target_amount: float = Field(gt=0, description="Monto objetivo; debe ser mayor a 0")
    due_date: datetime.date | None = Field(default=None, description="Fecha límite, opcional")


class GoalUpdate(BaseModel):
    """Actualización parcial. `due_date: null` quita la fecha límite.

    `saved_amount` no se puede editar desde acá a propósito: se mueve con aportes
    (POST /goals/{id}/contributions), que es lo que registra el avance.
    """

    name: str | None = Field(default=None, min_length=1, max_length=120)
    target_amount: float | None = Field(default=None, gt=0)
    due_date: datetime.date | None = None


class ContributionCreate(BaseModel):
    """Aporte a una meta. Se suma a lo ya ahorrado."""

    amount: float = Field(gt=0, description="Monto del aporte; debe ser mayor a 0")


class GoalOut(BaseModel):
    """Una meta con su avance ya calculado, listo para la barra de progreso."""

    id: int
    name: str
    target_amount: float
    saved_amount: float
    due_date: datetime.date | None
    progress: float = Field(
        description="Porcentaje ahorrado. Puede pasar de 100 si se aportó de más; "
        "la barra de la pantalla lo recorta a 100."
    )
    remaining: float = Field(description="Lo que falta para el objetivo; 0 si ya se alcanzó")
    completed: bool = Field(description="True cuando lo ahorrado llegó o superó el objetivo")
