from pydantic_settings import BaseSettings, SettingsConfigDict
from typing import List
from typing import Literal


class Settings(BaseSettings):
    """
    All config values are loaded from environment variables (via .env at runtime).
    No defaults contain secrets — only structural defaults.
    """

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=False,
        extra="ignore",
    )

    # App
    app_name: str = "Visioneers Product AI"
    app_version: str = "0.1.0"
    app_env: str = "development"

    # Logging
    log_level: Literal["DEBUG", "INFO", "WARNING", "ERROR"] = "INFO"
    log_json_format: bool = False  # Set to True in production

    # Server
    backend_host: str = "0.0.0.0"
    backend_port: int = 8000
    backend_reload: bool = True

    # Security
    secret_key: str
    jwt_secret: str
    jwt_algorithm: str = "HS256"
    jwt_expire_minutes: int = 60

    # CORS — stored as comma-separated string, parsed into list
    allowed_origins: str = "http://localhost:5173"

    @property
    def origins_list(self) -> List[str]:
        """Parse comma-separated ALLOWED_ORIGINS into a proper list."""
        return [o.strip() for o in self.allowed_origins.split(",") if o.strip()]

    # Redis
    redis_url: str = "redis://redis:6379/0"
    redis_password: str = ""

    # AI / External API Keys (backend-only, never sent to client)
    openai_api_key: str = ""
    anthropic_api_key: str = ""
    tavily_api_key: str = ""


settings = Settings()  # type: ignore[call-arg]
