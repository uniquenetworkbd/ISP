import pytest
from cryptography.fernet import Fernet

from app.core.config import validate_production_configuration


def test_production_configuration_accepts_secure_explicit_values() -> None:
    validate_production_configuration(
        app_env="production",
        database_url="postgresql+psycopg://isp:secret@db.example.net:5432/isp",
        allowed_origins=["https://uniquenetworkbd.github.io"],
        jwt_secret="random-production-secret-value-which-is-long-enough",
        encryption_key=Fernet.generate_key().decode(),
    )


def test_production_configuration_rejects_development_defaults() -> None:
    with pytest.raises(RuntimeError, match="Unsafe production configuration"):
        validate_production_configuration(
            app_env="production",
            database_url="postgresql+psycopg://isp:isp@localhost:5432/isp",
            allowed_origins=["http://localhost:5173"],
            jwt_secret="dev-only-change-this-secret",
            encryption_key=None,
        )


def test_development_configuration_keeps_local_defaults_usable() -> None:
    validate_production_configuration(
        app_env="development",
        database_url="postgresql+psycopg://isp:isp@localhost:5432/isp",
        allowed_origins=["http://localhost:5173"],
        jwt_secret="dev-only-change-this-secret",
        encryption_key=None,
    )
