from typing import Literal

from pydantic import BaseModel, Field

BudgetStatus = Literal["ok", "warning", "exceeded"]

# Umbral a partir del cual el presupuesto pasa a "warning" (HU-12 lo muestra como alerta)
WARNING_THRESHOLD = 80.0


class BudgetUpsert(BaseModel):
    category_id: int | None = Field(default=None, description="None = presupuesto global del mes")
    monthly_limit: float = Field(gt=0)


class BudgetOut(BaseModel):
    id: int
    category_id: int | None
    monthly_limit: float

    model_config = {"from_attributes": True}


class BudgetStatusOut(BaseModel):
    id: int
    category_id: int | None
    category_name: str | None
    monthly_limit: float
    spent: float
    remaining: float
    percent_used: float
    status: BudgetStatus


class BudgetSummaryOut(BaseModel):
    month: str
    budgets: list[BudgetStatusOut]
    alerts: list[BudgetStatusOut]
    has_alerts: bool
