"""Persist device connection test history.

Revision ID: 0004_device_connection_tests
Revises: 0003_mikrotik_inventory
"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa

revision: str = "0004_device_connection_tests"
down_revision: Union[str, Sequence[str], None] = "0003_mikrotik_inventory"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "device_connection_tests",
        sa.Column("id", sa.BigInteger(), primary_key=True, autoincrement=True),
        sa.Column("device_id", sa.BigInteger(), sa.ForeignKey("devices.id", ondelete="CASCADE"), nullable=False),
        sa.Column("protocol", sa.String(16), nullable=False),
        sa.Column("status", sa.String(24), nullable=False),
        sa.Column("duration_ms", sa.Integer(), nullable=True),
        sa.Column("routeros_version", sa.String(120), nullable=True),
        sa.Column("error_code", sa.String(80), nullable=True),
        sa.Column("checked_by", sa.BigInteger(), sa.ForeignKey("users.id"), nullable=True),
        sa.Column("checked_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
    )
    op.create_index("idx_connection_tests_device_time", "device_connection_tests", ["device_id", "checked_at"])


def downgrade() -> None:
    op.drop_index("idx_connection_tests_device_time", table_name="device_connection_tests")
    op.drop_table("device_connection_tests")
