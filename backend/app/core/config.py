from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """Configuración global leída de variables de entorno / .env"""

    database_url: str = "sqlite:///./budgetwise.db"
    secret_key: str = "dev-secret-cambiar-en-produccion"
    access_token_expire_minutes: int = 60
    environment: str = "development"

    # HU-14: si se configura una API key de Anthropic, las recomendaciones se
    # redactan con un LLM; sin key (o si la llamada falla) se usan las plantillas.
    anthropic_api_key: str = ""
    ai_model: str = "claude-haiku-4-5"

    model_config = SettingsConfigDict(env_file=".env", extra="ignore")


settings = Settings()
