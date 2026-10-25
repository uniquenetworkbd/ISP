from sqlalchemy import text
from sqlalchemy.engine import Engine

from app.db import engine


EXPECTED_TABLES = {
    "zones",
    "pops",
    "devices",
    "pon_ports",
    "onus",
    "metrics",
    "alerts",
    "roles",
    "users",
    "user_roles",
    "device_credentials",
    "audit_logs",
}


def database_is_reachable(db_engine: Engine = engine) -> bool:
    with db_engine.connect() as connection:
        connection.execute(text("SELECT 1"))
    return True
