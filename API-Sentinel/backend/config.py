"""Application configuration and environment loading."""

from functools import lru_cache

from pydantic import Field
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """Runtime settings loaded from environment variables."""

    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8", extra="ignore")

    app_name: str = "API-Sentinel"
    app_version: str = "1.0.0"
    environment: str = Field(default="development", alias="ENVIRONMENT")
    database_url: str = Field(default="sqlite:///./database/api_sentinel.db", alias="DATABASE_URL")
    jwt_secret_key: str = Field(default="dev-secret-change-me-to-a-longer-32-plus-byte-key", alias="JWT_SECRET_KEY")
    jwt_algorithm: str = "HS256"
    jwt_expiry_minutes: int = Field(default=120, alias="JWT_EXPIRY_MINUTES")
    log_level: str = Field(default="INFO", alias="LOG_LEVEL")
    rate_limit_window_seconds: int = Field(default=60, alias="RATE_LIMIT_WINDOW_SECONDS")
    rate_limit_max_requests: int = Field(default=100, alias="RATE_LIMIT_MAX_REQUESTS")
    cors_allow_origins: list[str] = Field(default_factory=lambda: ["http://localhost:5173", "http://127.0.0.1:5173"])


@lru_cache(maxsize=1)
def get_settings() -> Settings:
    """Return the cached application settings."""

    return Settings()