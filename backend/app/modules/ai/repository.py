"""Lectura de datos para el análisis de HU-14.

Reutiliza los repositories de los otros módulos del monolito en vez de duplicar
consultas: el módulo ai analiza, no persiste nada propio.
"""
from datetime import date

from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.models.models import Goal, Transaction, TransactionType
from app.modules.budgets import repository as budgets_repository
from app.modules.transactions import repository as transactions_repository

totals_by_type = transactions_repository.totals_by_type
totals_by_category = transactions_repository.totals_by_category
list_budgets = budgets_repository.list_by_user
spent_in_month = budgets_repository.spent_in_month


def list_goals(db: Session, user_id: int) -> list[Goal]:
    return list(db.scalars(select(Goal).where(Goal.user_id == user_id)))


def uncategorized_expense(db: Session, user_id: int, start: date, end: date) -> float:
    stmt = select(func.coalesce(func.sum(Transaction.amount), 0)).where(
        Transaction.user_id == user_id,
        Transaction.type == TransactionType.expense,
        Transaction.category_id.is_(None),
        Transaction.date >= start,
        Transaction.date <= end,
    )
    return float(db.scalar(stmt) or 0)
