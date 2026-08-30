from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """Configuración global leída de variables de entorno / .env"""

    database_url: str = "sqlite:///./budgetwise.db"
    secret_key: str = "dev-secret-cambiar-en-produccion"
    access_token_expire_minutes: int = 60
    environment: str = "development"

    model_config = SettingsConfigDict(env_file=".env", extra="ignore")


settings = Settings()
