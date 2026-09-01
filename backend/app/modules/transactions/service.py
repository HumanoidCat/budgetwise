"""HU-04: casos de uso de ingresos y gastos. Toda la lógica de negocio vive aquí."""
from datetime import date

from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from app.models.models import Transaction, TransactionType
from app.modules.transactions import repository
from app.modules.transactions.schemas import (
    TransactionCreate,
    TransactionListOut,
    TransactionOut,
    TransactionUpdate,
)


def to_out(transaction: Transaction) -> TransactionOut:
    """Convierte el modelo a su contrato HTTP (el monto sale como Decimal de la BD)."""
    return TransactionOut(
        id=transaction.id,
        type=transaction.type.value,
        amount=float(transaction.amount),
        date=transaction.date,
        category_id=transaction.category_id,
        category_name=transaction.category.name if transaction.category else None,
        description=transaction.description,
    )


def _ensure_category(db: Session, user_id: int, category_id: int | None) -> None:
    if category_id is not None and not repository.category_exists(db, user_id, category_id):
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Categoría no encontrada",
        )


def _ensure_date_range(date_from: date | None, date_to: date | None) -> None:
    if date_from is not None and date_to is not None and date_from > date_to:
        raise HTTPException(status_code=422, detail="date_from no puede ser posterior a date_to")


def _get_owned(db: Session, user_id: int, transaction_id: int) -> Transaction:
    transaction = repository.get_by_id(db, user_id, transaction_id)
    if transaction is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Transacción no encontrada",
        )
    return transaction


def create_transaction(db: Session, user_id: int, payload: TransactionCreate) -> TransactionOut:
    _ensure_category(db, user_id, payload.category_id)
    transaction = repository.create(
        db,
        user_id,
        type_=TransactionType(payload.type),
        amount=payload.amount,
        tx_date=payload.date,
        category_id=payload.category_id,
        description=payload.description,
    )
    return to_out(transaction)


def get_transaction(db: Session, user_id: int, transaction_id: int) -> TransactionOut:
    return to_out(_get_owned(db, user_id, transaction_id))


def list_transactions(
    db: Session,
    user_id: int,
    *,
    type_: str | None = None,
    category_id: int | None = None,
    date_from: date | None = None,
    date_to: date | None = None,
    limit: int = 50,
    offset: int = 0,
) -> TransactionListOut:
    _ensure_date_range(date_from, date_to)
    _ensure_category(db, user_id, category_id)
    filters = {
        "type_": TransactionType(type_) if type_ else None,
        "category_id": category_id,
        "date_from": date_from,
        "date_to": date_to,
    }
    items = repository.list_by_user(db, user_id, limit=limit, offset=offset, **filters)
    total = repository.count_by_user(db, user_id, **filters)
    return TransactionListOut(
        items=[to_out(t) for t in items],
        total=total,
        limit=limit,
        offset=offset,
    )


def update_transaction(
    db: Session, user_id: int, transaction_id: int, payload: TransactionUpdate
) -> TransactionOut:
    """Actualización parcial: solo toca los campos que vinieron en el body."""
    transaction = _get_owned(db, user_id, transaction_id)
    changes = payload.model_dump(exclude_unset=True)

    # category_id es el único campo donde null es un cambio real: quita la categoría.
    if "category_id" in changes:
        _ensure_category(db, user_id, changes["category_id"])
        transaction.category_id = changes["category_id"]
    if changes.get("type") is not None:
        transaction.type = TransactionType(changes["type"])
    if changes.get("amount") is not None:
        transaction.amount = changes["amount"]
    if changes.get("date") is not None:
        transaction.date = changes["date"]
    if changes.get("description") is not None:
        transaction.description = changes["description"]

    return to_out(repository.save(db, transaction))


def delete_transaction(db: Session, user_id: int, transaction_id: int) -> None:
    repository.delete(db, _get_owned(db, user_id, transaction_id))
