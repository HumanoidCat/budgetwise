"""HU-11: presupuesto mensual (global y por categoría) y detección de sobrepaso."""
import calendar
from datetime import date

from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from app.models.models import Budget
from app.modules.budgets import repository
from app.modules.budgets.schemas import WARNING_THRESHOLD, BudgetStatusOut, BudgetSummaryOut


def month_range(month: str | None) -> tuple[str, date, date]:
    """Devuelve ('YYYY-MM', primer día, último día). month=None → mes actual."""
    if month is None:
        today = date.today()
        year, mon = today.year, today.month
    else:
        try:
            year, mon = (int(p) for p in month.split("-"))
            date(year, mon, 1)
        except (ValueError, TypeError):
            raise HTTPException(status_code=422, detail="El mes debe tener formato YYYY-MM") from None
    last_day = calendar.monthrange(year, mon)[1]
    return f"{year:04d}-{mon:02d}", date(year, mon, 1), date(year, mon, last_day)


def classify(spent: float, limit: float) -> tuple[float, str]:
    percent = round((spent / limit) * 100, 1) if limit > 0 else 0.0
    if percent > 100:
        return percent, "exceeded"
    if percent >= WARNING_THRESHOLD:
        return percent, "warning"
    return percent, "ok"


def set_budget(db: Session, user_id: int, category_id: int | None, monthly_limit: float) -> Budget:
    if category_id is not None and not repository.category_exists(db, user_id, category_id):
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Categoría no encontrada")
    return repository.upsert(db, user_id, category_id, monthly_limit)


def remove_budget(db: Session, user_id: int, budget_id: int) -> None:
    budget = repository.get_by_id(db, user_id, budget_id)
    if budget is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Presupuesto no encontrado")
    repository.delete(db, budget)


def budget_status(db: Session, user_id: int, budget: Budget, start: date, end: date) -> BudgetStatusOut:
    limit = float(budget.monthly_limit)
    spent = repository.spent_in_month(db, user_id, start, end, budget.category_id)
    percent, state = classify(spent, limit)
    return BudgetStatusOut(
        id=budget.id,
        category_id=budget.category_id,
        category_name=repository.category_name(db, budget.category_id),
        monthly_limit=limit,
        spent=round(spent, 2),
        remaining=round(limit - spent, 2),
        percent_used=percent,
        status=state,
    )


def summary(db: Session, user_id: int, month: str | None) -> BudgetSummaryOut:
    label, start, end = month_range(month)
    statuses = [budget_status(db, user_id, b, start, end) for b in repository.list_by_user(db, user_id)]
    alerts = [s for s in statuses if s.status != "ok"]
    return BudgetSummaryOut(month=label, budgets=statuses, alerts=alerts, has_alerts=bool(alerts))
