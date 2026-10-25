"""Add MikroTik inventory, sync and encrypted credential fields.

Revision ID: 0003_mikrotik_inventory
Revises: 0002_resilience
"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

revision: str = "0003_mikrotik_inventory"
down_revision: Union[str, Sequence[str], None] = "0002_resilience"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column("devices", sa.Column("access_mode", sa.String(16), nullable=False, server_default="read"))
    op.add_column("devices", sa.Column("timeout_seconds", sa.Integer(), nullable=False, server_default="10"))
    op.add_column("devices", sa.Column("routeros_version", sa.String(120), nullable=True))
    op.add_column("devices", sa.Column("last_scan_at", sa.DateTime(timezone=True), nullable=True))
    op.add_column("devices", sa.Column("last_live_at", sa.DateTime(timezone=True), nullable=True))

    op.add_column("device_credentials", sa.Column("encrypted_username", sa.Text(), nullable=True))
    op.add_column("device_credentials", sa.Column("encrypted_password", sa.Text(), nullable=True))
    op.alter_column("device_credentials", "auth_mode", server_default="encrypted-db")

    op.create_table(
        "mikrotik_users",
        sa.Column("id", sa.BigInteger(), primary_key=True, autoincrement=True),
        sa.Column("device_id", sa.BigInteger(), sa.ForeignKey("devices.id", ondelete="CASCADE"), nullable=False),
        sa.Column("username", sa.String(160), nullable=False),
        sa.Column("customer_name", sa.String(200)),
        sa.Column("service_profile", sa.String(160)),
        sa.Column("service", sa.String(40)),
        sa.Column("assigned_ip", sa.String(80)),
        sa.Column("caller_id", sa.String(120)),
        sa.Column("status_snapshot", sa.String(32), nullable=False, server_default="unknown"),
        sa.Column("last_live_ip", sa.String(80)),
        sa.Column("last_live_uptime", sa.String(80)),
        sa.Column("metadata_json", postgresql.JSONB()),
        sa.Column("first_seen_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
        sa.Column("last_seen_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
        sa.Column("last_synced_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
    )
    op.create_index("idx_mikrotik_users_device", "mikrotik_users", ["device_id"])
    op.create_index("idx_mikrotik_users_username", "mikrotik_users", ["username"])
    op.create_index("idx_mikrotik_users_status", "mikrotik_users", ["status_snapshot"])


def downgrade() -> None:
    op.drop_index("idx_mikrotik_users_status", table_name="mikrotik_users")
    op.drop_index("idx_mikrotik_users_username", table_name="mikrotik_users")
    op.drop_index("idx_mikrotik_users_device", table_name="mikrotik_users")
    op.drop_table("mikrotik_users")
    op.drop_column("device_credentials", "encrypted_password")
    op.drop_column("device_credentials", "encrypted_username")
    op.drop_column("devices", "last_live_at")
    op.drop_column("devices", "last_scan_at")
    op.drop_column("devices", "routeros_version")
    op.drop_column("devices", "timeout_seconds")
    op.drop_column("devices", "access_mode")
