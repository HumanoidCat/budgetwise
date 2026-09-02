from sqlalchemy import func, select, update
from sqlalchemy.orm import Session

from app.models.models import Budget, Category, Transaction


def list_by_user(db: Session, user_id: int) -> list[Category]:
    stmt = select(Category).where(Category.user_id == user_id).order_by(Category.name)
    return list(db.scalars(stmt))


def get_by_id(db: Session, user_id: int, category_id: int) -> Category | None:
    return db.scalar(select(Category).where(Category.id == category_id, Category.user_id == user_id))


def get_by_name(db: Session, user_id: int, name: str) -> Category | None:
    """Busca sin distinguir mayúsculas: 'Comida' y 'comida' son la misma categoría."""
    stmt = select(Category).where(
        Category.user_id == user_id,
        func.lower(Category.name) == name.lower(),
    )
    return db.scalar(stmt)


def create(db: Session, user_id: int, name: str, icon: str) -> Category:
    category = Category(user_id=user_id, name=name, icon=icon)
    db.add(category)
    db.commit()
    db.refresh(category)
    return category


def create_many(db: Session, user_id: int, items: list[tuple[str, str]]) -> list[Category]:
    """Alta en lote, para las categorías por defecto de un usuario nuevo."""
    categories = [Category(user_id=user_id, name=name, icon=icon) for name, icon in items]
    db.add_all(categories)
    db.commit()
    return categories


def save(db: Session, category: Category) -> Category:
    """Confirma los cambios hechos sobre una categoría ya cargada."""
    db.commit()
    db.refresh(category)
    return category


def count_transactions(db: Session, category_id: int) -> int:
    stmt = select(func.count()).select_from(Transaction).where(Transaction.category_id == category_id)
    return db.scalar(stmt) or 0


def count_budgets(db: Session, category_id: int) -> int:
    stmt = select(func.count()).select_from(Budget).where(Budget.category_id == category_id)
    return db.scalar(stmt) or 0


def reassign_transactions(db: Session, from_id: int, to_id: int) -> int:
    """Mueve las transacciones de una categoría a otra. Devuelve cuántas movió."""
    result = db.execute(
        update(Transaction)
        .where(Transaction.category_id == from_id)
        .values(category_id=to_id)
        .execution_options(synchronize_session=False)
    )
    db.commit()
    return result.rowcount or 0


def delete(db: Session, category: Category) -> None:
    db.delete(category)
    db.commit()
