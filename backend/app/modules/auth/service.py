from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from app.core.security import create_access_token, hash_password, verify_password
from app.models.models import User
from app.modules.auth import repository


def register_user(db: Session, *, email: str, password: str, name: str = "") -> tuple[User, str]:
    """HU-01: registra un usuario nuevo y devuelve (usuario, token)."""
    if repository.get_by_email(db, email):
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Ya existe una cuenta con ese correo",
        )
    user = repository.create(db, email=email, hashed_password=hash_password(password), name=name)
    # TODO HU-03 (Luna): crear aquí las categorías por defecto del usuario
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
