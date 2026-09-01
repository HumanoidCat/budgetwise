"""Contratos Pydantic del módulo transactions (HU-04)."""
import datetime
from typing import Literal

from pydantic import BaseModel, Field

# Espejo de TransactionType (app/models/models.py) en el contrato HTTP.
TransactionTypeIn = Literal["income", "expense"]

DEFAULT_PAGE_SIZE = 50
MAX_PAGE_SIZE = 200


class TransactionCreate(BaseModel):
    """Alta de una transacción. El user_id NO viaja en el body: sale del token."""

    type: TransactionTypeIn
    amount: float = Field(gt=0, description="Monto de la transacción; debe ser mayor a 0")
    date: datetime.date
    category_id: int | None = Field(default=None, description="null = sin categoría")
    description: str = Field(default="", max_length=255)


class TransactionUpdate(BaseModel):
    """Actualización parcial: solo se aplican los campos presentes en el body.

    `category_id: null` sí es un cambio válido (quita la categoría). El resto de
    los campos, si llegan en null, se ignoran.
    """

    type: TransactionTypeIn | None = None
    amount: float | None = Field(default=None, gt=0)
    date: datetime.date | None = None
    category_id: int | None = None
    description: str | None = Field(default=None, max_length=255)


class TransactionOut(BaseModel):
    id: int
    type: TransactionTypeIn
    amount: float
    date: datetime.date
    category_id: int | None
    category_name: str | None
    description: str


class TransactionListOut(BaseModel):
    """Listado paginado. `total` es el conteo con los filtros aplicados, sin paginar."""

    items: list[TransactionOut]
    total: int
    limit: int
    offset: int
