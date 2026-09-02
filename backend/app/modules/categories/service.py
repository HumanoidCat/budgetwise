"""HU-03: CRUD de categorías y siembra de las categorías por defecto."""
from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from app.models.models import Category
from app.modules.categories import repository

# Categorías que recibe todo usuario nuevo al registrarse.
DEFAULT_CATEGORIES: list[tuple[str, str]] = [
    ("Salario", "wallet"),
    ("Alimentación", "restaurant"),
    ("Transporte", "car"),
    ("Vivienda", "home"),
    ("Servicios", "bolt"),
    ("Salud", "heart"),
    ("Educación", "book"),
    ("Entretenimiento", "movie"),
    ("Otros", "tag"),
]


def create_default_categories(db: Session, user_id: int) -> list[Category]:
    """Idempotente: si el usuario ya tiene categorías, no hace nada."""
    if repository.list_by_user(db, user_id):
        return []
    return repository.create_many(db, user_id, DEFAULT_CATEGORIES)


def list_categories(db: Session, user_id: int) -> list[Category]:
    return repository.list_by_user(db, user_id)


def get_category(db: Session, user_id: int, category_id: int) -> Category:
    category = repository.get_by_id(db, user_id, category_id)
    if category is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Categoría no encontrada")
    return category


def create_category(db: Session, user_id: int, name: str, icon: str) -> Category:
    if repository.get_by_name(db, user_id, name):
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=f"Ya existe una categoría llamada '{name}'",
        )
    return repository.create(db, user_id, name, icon)


def update_category(
    db: Session, user_id: int, category_id: int, name: str | None, icon: str | None
) -> Category:
    category = get_category(db, user_id, category_id)
    if name is not None and name.lower() != category.name.lower():
        if repository.get_by_name(db, user_id, name):
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail=f"Ya existe una categoría llamada '{name}'",
            )
    if name is not None:
        category.name = name
    if icon is not None:
        category.icon = icon
    return repository.save(db, category)


def delete_category(db: Session, user_id: int, category_id: int, reassign_to: int | None) -> None:
    """Borra una categoría que no esté en uso.

    Con reassign_to, primero mueve las transacciones a la categoría indicada.
    """
    category = get_category(db, user_id, category_id)

    if repository.count_budgets(db, category.id) > 0:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="La categoría tiene un presupuesto asociado. Eliminá el presupuesto primero.",
        )

    if reassign_to is not None:
        if reassign_to == category_id:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="No se puede reasignar una categoría a sí misma",
            )
        destino = get_category(db, user_id, reassign_to)
        repository.reassign_transactions(db, category.id, destino.id)
    elif repository.count_transactions(db, category.id) > 0:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="La categoría tiene transacciones. Usá ?reassign_to=<id> o eliminalas primero.",
        )

    repository.delete(db, category)
