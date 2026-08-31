from sqlalchemy import create_engine
from sqlalchemy.orm import DeclarativeBase, Session, sessionmaker

from app.core.config import settings

database_url = settings.database_url
# Render/Heroku entregan "postgres://", pero SQLAlchemy 2 exige "postgresql://"
if database_url.startswith("postgres://"):
    database_url = database_url.replace("postgres://", "postgresql://", 1)

connect_args = {"check_same_thread": False} if database_url.startswith("sqlite") else {}
engine = create_engine(database_url, connect_args=connect_args)
SessionLocal = sessionmaker(bind=engine, autoflush=False, autocommit=False)


class Base(DeclarativeBase):
    """Base declarativa para todos los modelos."""


def get_db():
    """Dependencia de FastAPI: una sesión de BD por request."""
    db: Session = SessionLocal()
    try:
        yield db
    finally:
        db.close()
