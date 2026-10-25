from typing import Literal
from urllib.parse import urlparse

from cryptography.fernet import Fernet
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    app_name: str = "ISP NOC Backend"
    app_version: str = "0.1.0"
    app_env: Literal["development", "test", "production"] = "development"
    database_url: str = "postgresql+psycopg://isp:isp@localhost:5432/isp"
    allowed_origins: list[str] = ["http://localhost:8000", "http://localhost:5173", "https://uniquenetworkbd.github.io"]
    jwt_secret: str = "dev-only-change-this-secret"
    jwt_algorithm: str = "HS256"
    access_token_minutes: int = 30

    model_config = SettingsConfigDict(env_file=".env", extra="ignore")


settings = Settings()


def validate_production_configuration(
    *,
    app_env: str,
    database_url: str,
    allowed_origins: list[str],
    jwt_secret: str,
    encryption_key: str | None,
) -> None:
    """Fail closed on common unsafe defaults when APP_ENV=production."""
    if app_env.strip().lower() != "production":
        return

    problems: list[str] = []
    if len(jwt_secret) < 32 or jwt_secret == "dev-only-change-this-secret":
        problems.append("JWT_SECRET must be a unique random value of at least 32 characters")

    parsed_db = urlparse(database_url)
    if not parsed_db.hostname or parsed_db.hostname in {"localhost", "127.0.0.1", "::1"}:
        problems.append("DATABASE_URL must point to the intended production database host")

    if not allowed_origins:
        problems.append("ALLOWED_ORIGINS must contain the exact frontend origin")
    else:
        for origin in allowed_origins:
            parsed_origin = urlparse(origin)
            if (
                parsed_origin.scheme != "https"
                or not parsed_origin.hostname
                or parsed_origin.path not in ("", "/")
                or parsed_origin.query
                or parsed_origin.fragment
            ):
                problems.append("Production ALLOWED_ORIGINS entries must be HTTPS origins without paths or query strings")
                break

    if not encryption_key:
        problems.append("CREDENTIAL_ENCRYPTION_KEY must be configured")
    else:
        try:
            Fernet(encryption_key.encode())
        except (ValueError, TypeError):
            problems.append("CREDENTIAL_ENCRYPTION_KEY must be a valid Fernet key")

    if problems:
        raise RuntimeError("Unsafe production configuration: " + "; ".join(problems))
