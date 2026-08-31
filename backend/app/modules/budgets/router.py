"""Módulo budgets — HU-11: presupuesto mensual y detección de sobrepaso.

El endpoint GET /budgets/status es el que consume la app para las alertas (HU-12).
"""
from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.models.models import User
from app.modules.auth.dependencies import get_current_user
from app.modules.budgets import service
from app.modules.budgets.schemas import BudgetOut, BudgetSummaryOut, BudgetUpsert

router = APIRouter(prefix="/budgets", tags=["budgets"])


@router.put("", response_model=BudgetOut)
def set_budget(
    payload: BudgetUpsert,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> BudgetOut:
    """Crea o actualiza el presupuesto (global si category_id es null, o por categoría)."""
    budget = service.set_budget(db, user.id, payload.category_id, payload.monthly_limit)
    return BudgetOut.model_validate(budget)


@router.get("/status", response_model=BudgetSummaryOut)
def budgets_status(
    month: str | None = Query(default=None, description="YYYY-MM; por defecto el mes actual"),
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> BudgetSummaryOut:
    """Estado de todos los presupuestos del mes: gastado, %, y alertas (warning >= 80%, exceeded > 100%)."""
    return service.summary(db, user.id, month)


@router.delete("/{budget_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_budget(
    budget_id: int,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> None:
    service.remove_budget(db, user.id, budget_id)
