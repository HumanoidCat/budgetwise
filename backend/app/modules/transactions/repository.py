"""Capa de persistencia del módulo transactions (HU-04). Sin reglas de negocio."""
from datetime import date

from sqlalchemy import extract, func, select
from sqlalchemy.orm import Session, joinedload

from app.models.models import Category, Transaction, TransactionType


def _conditions(
    user_id: int,
    *,
    type_: TransactionType | None = None,
    category_id: int | None = None,
    date_from: date | None = None,
    date_to: date | None = None,
) -> list:
    """Filtros compartidos por el listado y el conteo. Siempre acota al usuario."""
    conditions = [Transaction.user_id == user_id]
    if type_ is not None:
        conditions.append(Transaction.type == type_)
    if category_id is not None:
        conditions.append(Transaction.category_id == category_id)
    if date_from is not None:
        conditions.append(Transaction.date >= date_from)
    if date_to is not None:
        conditions.append(Transaction.date <= date_to)
    return conditions


def list_by_user(
    db: Session,
    user_id: int,
    *,
    type_: TransactionType | None = None,
    category_id: int | None = None,
    date_from: date | None = None,
    date_to: date | None = None,
    limit: int = 50,
    offset: int = 0,
) -> list[Transaction]:
    stmt = (
        select(Transaction)
        .options(joinedload(Transaction.category))  # evita N+1 al leer category_name
        .where(*_conditions(
            user_id, type_=type_, category_id=category_id, date_from=date_from, date_to=date_to
        ))
        .order_by(Transaction.date.desc(), Transaction.id.desc())
        .limit(limit)
        .offset(offset)
    )
    return list(db.scalars(stmt))


def count_by_user(
    db: Session,
    user_id: int,
    *,
    type_: TransactionType | None = None,
    category_id: int | None = None,
    date_from: date | None = None,
    date_to: date | None = None,
) -> int:
    stmt = select(func.count(Transaction.id)).where(*_conditions(
        user_id, type_=type_, category_id=category_id, date_from=date_from, date_to=date_to
    ))
    return int(db.scalar(stmt) or 0)


def get_by_id(db: Session, user_id: int, transaction_id: int) -> Transaction | None:
    """Devuelve None también si la transacción es de otro usuario (no filtra 403 vs 404)."""
    stmt = (
        select(Transaction)
        .options(joinedload(Transaction.category))
        .where(Transaction.id == transaction_id, Transaction.user_id == user_id)
    )
    return db.scalar(stmt)


def create(
    db: Session,
    user_id: int,
    *,
    type_: TransactionType,
    amount: float,
    tx_date: date,
    category_id: int | None,
    description: str,
) -> Transaction:
    transaction = Transaction(
        user_id=user_id,
        type=type_,
        amount=amount,
        date=tx_date,
        category_id=category_id,
        description=description,
    )
    db.add(transaction)
    db.commit()
    db.refresh(transaction)
    return transaction


def save(db: Session, transaction: Transaction) -> Transaction:
    """Persiste los cambios hechos sobre una instancia ya cargada."""
    db.commit()
    db.refresh(transaction)
    return transaction


def delete(db: Session, transaction: Transaction) -> None:
    db.delete(transaction)
    db.commit()


def totals_by_type(
    db: Session,
    user_id: int,
    *,
    date_from: date | None = None,
    date_to: date | None = None,
) -> dict[TransactionType, float]:
    """Suma los montos del usuario agrupados por tipo. Un solo GROUP BY, no dos queries."""
    stmt = (
        select(Transaction.type, func.coalesce(func.sum(Transaction.amount), 0))
        .where(*_conditions(user_id, date_from=date_from, date_to=date_to))
        .group_by(Transaction.type)
    )
    return {row[0]: float(row[1]) for row in db.execute(stmt)}


def totals_by_category(
    db: Session,
    user_id: int,
    *,
    date_from: date | None = None,
    date_to: date | None = None,
) -> list[tuple[int | None, str | None, TransactionType, float]]:
    """Suma por (categoría, tipo). LEFT JOIN para no perder las transacciones sin categoría."""
    stmt = (
        select(
            Transaction.category_id,
            Category.name,
            Transaction.type,
            func.coalesce(func.sum(Transaction.amount), 0),
        )
        .join(Category, Category.id == Transaction.category_id, isouter=True)
        .where(*_conditions(user_id, date_from=date_from, date_to=date_to))
        .group_by(Transaction.category_id, Category.name, Transaction.type)
    )
    return [(row[0], row[1], row[2], float(row[3])) for row in db.execute(stmt)]


def totals_by_month(
    db: Session,
    user_id: int,
    *,
    date_from: date,
    date_to: date,
) -> list[tuple[int, int, TransactionType, float]]:
    """Suma por (año, mes, tipo) en el rango pedido. Devuelve solo los meses con datos.

    Se usa `extract` y no `strftime('%Y-%m', ...)`: strftime existe en SQLite pero
    no en PostgreSQL, así que las pruebas pasarían y producción fallaría. `extract`
    lo traduce SQLAlchemy al dialecto de cada base.
    """
    year = extract("year", Transaction.date)
    month = extract("month", Transaction.date)
    stmt = (
        select(year, month, Transaction.type, func.coalesce(func.sum(Transaction.amount), 0))
        .where(*_conditions(user_id, date_from=date_from, date_to=date_to))
        .group_by(year, month, Transaction.type)
    )
    return [(int(row[0]), int(row[1]), row[2], float(row[3])) for row in db.execute(stmt)]


def category_exists(db: Session, user_id: int, category_id: int) -> bool:
    """Valida que la categoría exista y sea del usuario.

    Se consulta el modelo Category directamente para no depender del módulo
    `categories` (HU-03, Alejandro Luna), que todavía no está implementado.
    """
    stmt = select(Category.id).where(Category.id == category_id, Category.user_id == user_id)
    return db.scalar(stmt) is not None
