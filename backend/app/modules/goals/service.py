"""HU-10: casos de uso de metas de ahorro. Toda la lógica de negocio vive aquí."""
from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from app.models.models import Goal
from app.modules.goals import repository
from app.modules.goals.schemas import GoalCreate, GoalOut, GoalUpdate


def to_out(goal: Goal) -> GoalOut:
    """Calcula el avance al vuelo. No se guarda en BD: se deriva de los dos montos."""
    target = float(goal.target_amount)
    saved = float(goal.saved_amount)
    # El objetivo siempre es > 0 por schema, pero una fila vieja podría no serlo.
    progress = round((saved / target) * 100, 1) if target > 0 else 0.0
    return GoalOut(
        id=goal.id,
        name=goal.name,
        target_amount=round(target, 2),
        saved_amount=round(saved, 2),
        due_date=goal.due_date,
        progress=progress,
        remaining=round(max(target - saved, 0), 2),
        completed=saved >= target,
    )


def _get_owned(db: Session, user_id: int, goal_id: int) -> Goal:
    goal = repository.get_by_id(db, user_id, goal_id)
    if goal is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Meta no encontrada")
    return goal


def create_goal(db: Session, user_id: int, payload: GoalCreate) -> GoalOut:
    goal = repository.create(
        db,
        user_id,
        name=payload.name,
        target_amount=payload.target_amount,
        due_date=payload.due_date,
    )
    return to_out(goal)


def get_goal(db: Session, user_id: int, goal_id: int) -> GoalOut:
    return to_out(_get_owned(db, user_id, goal_id))


def list_goals(db: Session, user_id: int) -> list[GoalOut]:
    """Lista las metas de mayor a menor avance, como las muestra el wireframe.

    El orden se resuelve en Python porque `progress` es un cálculo, no una columna,
    y un usuario tiene un puñado de metas, no miles.
    """
    goals = [to_out(g) for g in repository.list_by_user(db, user_id)]
    goals.sort(key=lambda g: (-g.progress, g.id))
    return goals


def update_goal(db: Session, user_id: int, goal_id: int, payload: GoalUpdate) -> GoalOut:
    """Actualización parcial: solo toca los campos que vinieron en el body."""
    goal = _get_owned(db, user_id, goal_id)
    changes = payload.model_dump(exclude_unset=True)

    # due_date es el único campo donde null es un cambio real: quita la fecha límite.
    if "due_date" in changes:
        goal.due_date = changes["due_date"]
    if changes.get("name") is not None:
        goal.name = changes["name"]
    if changes.get("target_amount") is not None:
        goal.target_amount = changes["target_amount"]

    return to_out(repository.save(db, goal))


def add_contribution(db: Session, user_id: int, goal_id: int, amount: float) -> GoalOut:
    """Registra un aporte. Se permite pasarse del objetivo: ahorrar de más no es un error."""
    goal = _get_owned(db, user_id, goal_id)
    return to_out(repository.add_to_saved(db, goal, amount))


def delete_goal(db: Session, user_id: int, goal_id: int) -> None:
    repository.delete(db, _get_owned(db, user_id, goal_id))
