from pydantic import BaseModel, Field, field_validator

# Coincide con el default de Category.icon en models.py
DEFAULT_ICON = "tag"


class CategoryCreate(BaseModel):
    name: str = Field(min_length=1, max_length=80)
    icon: str = Field(default=DEFAULT_ICON, max_length=40)

    @field_validator("name", "icon")
    @classmethod
    def sin_espacios_sobrantes(cls, v: str) -> str:
        limpio = v.strip()
        if not limpio:
            raise ValueError("no puede estar vacío")
        return limpio


class CategoryUpdate(BaseModel):
    """Actualización parcial: solo se cambian los campos enviados."""

    name: str | None = Field(default=None, min_length=1, max_length=80)
    icon: str | None = Field(default=None, max_length=40)

    @field_validator("name", "icon")
    @classmethod
    def sin_espacios_sobrantes(cls, v: str | None) -> str | None:
        if v is None:
            return None
        limpio = v.strip()
        if not limpio:
            raise ValueError("no puede estar vacío")
        return limpio


class CategoryOut(BaseModel):
    id: int
    name: str
    icon: str

    model_config = {"from_attributes": True}
