from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from app.core.security import create_access_token, hash_password, verify_password
from app.models.models import User
from app.modules.auth import repository
from app.modules.categories import service as categories_service


def register_user(db: Session, *, email: str, password: str, name: str = "") -> tuple[User, str]:
    """HU-01: registra un usuario nuevo y devuelve (usuario, token)."""
    if repository.get_by_email(db, email):
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Ya existe una cuenta con ese correo",
        )
    user = repository.create(db, email=email, hashed_password=hash_password(password), name=name)
    # HU-03: todo usuario nuevo arranca con sus categorías por defecto.
    categories_service.create_default_categories(db, user.id)
    token = create_access_token(str(user.id))
    return user, token


def login_user(db: Session, *, email: str, password: str) -> tuple[User, str]:
    """HU-02: valida credenciales y devuelve (usuario, token)."""
    user = repository.get_by_email(db, email)
    if not user or not verify_password(password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Correo o contraseña incorrectos",
        )
    token = create_access_token(str(user.id))
    return user, token
