from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    app_name: str = "ISP NOC Backend"
    app_version: str = "0.1.0"
    database_url: str = "postgresql+psycopg://isp:isp@localhost:5432/isp"
    allowed_origins: list[str] = ["http://localhost:8000", "http://localhost:5173", "https://uniquenetworkbd.github.io"]
    jwt_secret: str = "dev-only-change-this-secret"
    jwt_algorithm: str = "HS256"
    access_token_minutes: int = 30

    model_config = SettingsConfigDict(env_file=".env", extra="ignore")


settings = Settings()
