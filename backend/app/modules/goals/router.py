"""Módulo goals — HU-10: metas de ahorro (API).

Todos los endpoints exigen JWT: el usuario sale del token (`get_current_user`),
nunca del body. El router solo valida entrada/salida y delega en el service.
"""
from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.models.models import User
from app.modules.auth.dependencies import get_current_user
from app.modules.goals import service
from app.modules.goals.schemas import ContributionCreate, GoalCreate, GoalOut, GoalUpdate

router = APIRouter(prefix="/goals", tags=["goals"])


@router.post("", response_model=GoalOut, status_code=status.HTTP_201_CREATED)
def create_goal(
    payload: GoalCreate,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> GoalOut:
    """Crea una meta. Arranca con 0 ahorrado."""
    return service.create_goal(db, user.id, payload)


@router.get("", response_model=list[GoalOut])
def list_goals(
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> list[GoalOut]:
    """Lista las metas del usuario, de mayor a menor avance."""
    return service.list_goals(db, user.id)


@router.get("/{goal_id}", response_model=GoalOut)
def get_goal(
    goal_id: int,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> GoalOut:
    return service.get_goal(db, user.id, goal_id)


@router.patch("/{goal_id}", response_model=GoalOut)
def update_goal(
    goal_id: int,
    payload: GoalUpdate,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> GoalOut:
    """Actualiza nombre, objetivo o fecha. Lo ahorrado se mueve con aportes, no acá."""
    return service.update_goal(db, user.id, goal_id, payload)


@router.post("/{goal_id}/contributions", response_model=GoalOut, status_code=status.HTTP_201_CREATED)
def add_contribution(
    goal_id: int,
    payload: ContributionCreate,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> GoalOut:
    """Registra un aporte y devuelve la meta con el avance recalculado."""
    return service.add_contribution(db, user.id, goal_id, payload.amount)


@router.delete("/{goal_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_goal(
    goal_id: int,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> None:
    service.delete_goal(db, user.id, goal_id)
