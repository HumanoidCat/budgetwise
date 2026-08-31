from datetime import date

from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.models.models import Budget, Category, Transaction, TransactionType


def list_by_user(db: Session, user_id: int) -> list[Budget]:
    return list(db.scalars(select(Budget).where(Budget.user_id == user_id).order_by(Budget.id)))


def get_by_id(db: Session, user_id: int, budget_id: int) -> Budget | None:
    return db.scalar(select(Budget).where(Budget.id == budget_id, Budget.user_id == user_id))


def get_by_category(db: Session, user_id: int, category_id: int | None) -> Budget | None:
    stmt = select(Budget).where(Budget.user_id == user_id)
    stmt = stmt.where(Budget.category_id.is_(None)) if category_id is None else stmt.where(
        Budget.category_id == category_id
    )
    return db.scalar(stmt)


def upsert(db: Session, user_id: int, category_id: int | None, monthly_limit: float) -> Budget:
    budget = get_by_category(db, user_id, category_id)
    if budget is None:
        budget = Budget(user_id=user_id, category_id=category_id, monthly_limit=monthly_limit)
        db.add(budget)
    else:
        budget.monthly_limit = monthly_limit
    db.commit()
    db.refresh(budget)
    return budget


def delete(db: Session, budget: Budget) -> None:
    db.delete(budget)
    db.commit()


def category_exists(db: Session, user_id: int, category_id: int) -> bool:
    stmt = select(Category.id).where(Category.id == category_id, Category.user_id == user_id)
    return db.scalar(stmt) is not None


def category_name(db: Session, category_id: int | None) -> str | None:
    if category_id is None:
        return None
    return db.scalar(select(Category.name).where(Category.id == category_id))


def spent_in_month(
    db: Session, user_id: int, start: date, end: date, category_id: int | None
) -> float:
    """Suma de gastos del usuario en [start, end]; si category_id es None, suma todos."""
    stmt = select(func.coalesce(func.sum(Transaction.amount), 0)).where(
        Transaction.user_id == user_id,
        Transaction.type == TransactionType.expense,
        Transaction.date >= start,
        Transaction.date <= end,
    )
    if category_id is not None:
        stmt = stmt.where(Transaction.category_id == category_id)
    return float(db.scalar(stmt) or 0)
