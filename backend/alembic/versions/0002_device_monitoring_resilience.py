"""Persist per-device monitoring resilience state.

Revision ID: 0002_device_monitoring_resilience
Revises: 0001_initial_schema
"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa

revision: str = "0002_device_monitoring_resilience"
down_revision: Union[str, Sequence[str], None] = "0001_initial_schema"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column("devices", sa.Column("consecutive_failures", sa.Integer(), nullable=False, server_default="0"))
    op.add_column("devices", sa.Column("circuit_state", sa.String(16), nullable=False, server_default="closed"))
    op.add_column("devices", sa.Column("circuit_opened_at", sa.DateTime(timezone=True), nullable=True))
    op.add_column("devices", sa.Column("circuit_next_probe_at", sa.DateTime(timezone=True), nullable=True))
    op.add_column("devices", sa.Column("last_failure_at", sa.DateTime(timezone=True), nullable=True))
    op.create_index("idx_devices_circuit_state", "devices", ["circuit_state"])


def downgrade() -> None:
    op.drop_index("idx_devices_circuit_state", table_name="devices")
    op.drop_column("devices", "last_failure_at")
    op.drop_column("devices", "circuit_next_probe_at")
    op.drop_column("devices", "circuit_opened_at")
    op.drop_column("devices", "circuit_state")
    op.drop_column("devices", "consecutive_failures")
