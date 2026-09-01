"""Módulo categories — HU-03: CRUD de categorías autenticado."""
from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.models.models import User
from app.modules.auth.dependencies import get_current_user
from app.modules.categories import service
from app.modules.categories.schemas import CategoryCreate, CategoryOut, CategoryUpdate

router = APIRouter(prefix="/categories", tags=["categories"])


@router.get("", response_model=list[CategoryOut])
def list_categories(
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> list[CategoryOut]:
    """Categorías del usuario autenticado, ordenadas por nombre."""
    return [CategoryOut.model_validate(c) for c in service.list_categories(db, user.id)]


@router.post("", response_model=CategoryOut, status_code=status.HTTP_201_CREATED)
def create_category(
    payload: CategoryCreate,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> CategoryOut:
    category = service.create_category(db, user.id, payload.name, payload.icon)
    return CategoryOut.model_validate(category)


@router.get("/{category_id}", response_model=CategoryOut)
def get_category(
    category_id: int,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> CategoryOut:
    return CategoryOut.model_validate(service.get_category(db, user.id, category_id))


@router.patch("/{category_id}", response_model=CategoryOut)
def update_category(
    category_id: int,
    payload: CategoryUpdate,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> CategoryOut:
    category = service.update_category(db, user.id, category_id, payload.name, payload.icon)
    return CategoryOut.model_validate(category)


@router.delete("/{category_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_category(
    category_id: int,
    reassign_to: int | None = Query(
        default=None,
        description="Mueve las transacciones a esta categoría antes de borrar.",
    ),
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> None:
    service.delete_category(db, user.id, category_id, reassign_to)
