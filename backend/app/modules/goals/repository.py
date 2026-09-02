"""Capa de persistencia del módulo goals (HU-10). Sin reglas de negocio."""
from datetime import date

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.models import Goal


def list_by_user(db: Session, user_id: int) -> list[Goal]:
    stmt = select(Goal).where(Goal.user_id == user_id).order_by(Goal.id)
    return list(db.scalars(stmt))


def get_by_id(db: Session, user_id: int, goal_id: int) -> Goal | None:
    """Devuelve None también si la meta es de otro usuario (no distingue 403 de 404)."""
    stmt = select(Goal).where(Goal.id == goal_id, Goal.user_id == user_id)
    return db.scalar(stmt)


def create(
    db: Session,
    user_id: int,
    *,
    name: str,
    target_amount: float,
    due_date: date | None,
) -> Goal:
    goal = Goal(
        user_id=user_id,
        name=name,
        target_amount=target_amount,
        saved_amount=0,
        due_date=due_date,
    )
    db.add(goal)
    db.commit()
    db.refresh(goal)
    return goal


def save(db: Session, goal: Goal) -> Goal:
    """Persiste los cambios hechos sobre una instancia ya cargada."""
    db.commit()
    db.refresh(goal)
    return goal


def add_to_saved(db: Session, goal: Goal, amount: float) -> Goal:
    """Suma un aporte a lo ahorrado.

    La suma se expresa como `Goal.saved_amount + amount` para que la haga la base
    y no Python. Si se leyera el valor, se sumara en memoria y se reescribiera,
    dos aportes simultáneos desde dos dispositivos podrían pisarse y perderse uno.
    """
    goal.saved_amount = Goal.saved_amount + amount
    db.commit()
    db.refresh(goal)
    return goal


def delete(db: Session, goal: Goal) -> None:
    db.delete(goal)
    db.commit()
