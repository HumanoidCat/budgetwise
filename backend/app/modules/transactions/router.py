"""Módulo transactions — HU-04 (CRUD de ingresos y gastos) y HU-05 (saldo y resumen).

Todos los endpoints exigen JWT: el usuario sale del token (`get_current_user`),
nunca del body. El router solo valida entrada/salida y delega en el service.
"""
import datetime

from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.models.models import User
from app.modules.auth.dependencies import get_current_user
from app.modules.transactions import service
from app.modules.transactions.schemas import (
    DEFAULT_PAGE_SIZE,
    MAX_PAGE_SIZE,
    SummaryOut,
    TransactionCreate,
    TransactionListOut,
    TransactionOut,
    TransactionTypeIn,
    TransactionUpdate,
)

router = APIRouter(prefix="/transactions", tags=["transactions"])


@router.post("", response_model=TransactionOut, status_code=status.HTTP_201_CREATED)
def create_transaction(
    payload: TransactionCreate,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> TransactionOut:
    """Registra un ingreso o un gasto del usuario autenticado."""
    return service.create_transaction(db, user.id, payload)


@router.get("", response_model=TransactionListOut)
def list_transactions(
    type: TransactionTypeIn | None = Query(default=None, description="income o expense"),
    category_id: int | None = Query(default=None),
    date_from: datetime.date | None = Query(default=None, description="YYYY-MM-DD, inclusive"),
    date_to: datetime.date | None = Query(default=None, description="YYYY-MM-DD, inclusive"),
    limit: int = Query(default=DEFAULT_PAGE_SIZE, ge=1, le=MAX_PAGE_SIZE),
    offset: int = Query(default=0, ge=0),
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> TransactionListOut:
    """Lista las transacciones del usuario, de la más reciente a la más antigua."""
    return service.list_transactions(
        db,
        user.id,
        type_=type,
        category_id=category_id,
        date_from=date_from,
        date_to=date_to,
        limit=limit,
        offset=offset,
    )


# IMPORTANTE: /summary va declarada ANTES que /{transaction_id}.
# FastAPI evalúa las rutas en orden; si /{transaction_id} fuera primero, intentaría
# convertir "summary" a int y devolvería 422 en vez de entrar acá.
@router.get("/summary", response_model=SummaryOut)
def summary(
    month: str | None = Query(default=None, description="YYYY-MM; por defecto el mes actual"),
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> SummaryOut:
    """HU-05: saldo histórico del usuario y desglose del mes (totales y por categoría)."""
    return service.summary(db, user.id, month)


@router.get("/{transaction_id}", response_model=TransactionOut)
def get_transaction(
    transaction_id: int,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> TransactionOut:
    return service.get_transaction(db, user.id, transaction_id)


@router.patch("/{transaction_id}", response_model=TransactionOut)
def update_transaction(
    transaction_id: int,
    payload: TransactionUpdate,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> TransactionOut:
    """Actualiza solo los campos enviados."""
    return service.update_transaction(db, user.id, transaction_id, payload)


@router.delete("/{transaction_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_transaction(
    transaction_id: int,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> None:
    service.delete_transaction(db, user.id, transaction_id)
