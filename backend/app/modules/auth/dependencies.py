"""Dependencia de autenticación para TODOS los módulos.

Uso en cualquier router:

    from app.modules.auth.dependencies import get_current_user

    @router.get("/")
    def listar(user: User = Depends(get_current_user), db: Session = Depends(get_db)):
        ...
"""
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from jose import JWTError, jwt
from sqlalchemy.orm import Session

from app.core.config import settings
from app.core.database import get_db
from app.core.security import ALGORITHM
from app.models.models import User
from app.modules.auth import repository

bearer_scheme = HTTPBearer(auto_error=False)

_CREDENTIALS_ERROR = HTTPException(
    status_code=status.HTTP_401_UNAUTHORIZED,
    detail="Token inválido o expirado",
    headers={"WWW-Authenticate": "Bearer"},
)


def get_current_user(
    credentials: HTTPAuthorizationCredentials | None = Depends(bearer_scheme),
    db: Session = Depends(get_db),
) -> User:
    if credentials is None:
        raise _CREDENTIALS_ERROR
    try:
        payload = jwt.decode(credentials.credentials, settings.secret_key, algorithms=[ALGORITHM])
        user_id = int(payload["sub"])
    except (JWTError, KeyError, ValueError):
        raise _CREDENTIALS_ERROR from None
    user = repository.get_by_id(db, user_id)
    if user is None:
        raise _CREDENTIALS_ERROR
    return user
