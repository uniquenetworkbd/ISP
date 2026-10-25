"""Create the ISP NOC baseline schema.

Revision ID: 0001_initial_schema
Revises:
"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

revision: str = "0001_initial_schema"
down_revision: Union[str, Sequence[str], None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "zones",
        sa.Column("id", sa.BigInteger(), primary_key=True, autoincrement=True),
        sa.Column("name", sa.String(120), nullable=False, unique=True),
        sa.Column("status", sa.String(32), nullable=False, server_default="online"),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
    )
    op.create_table(
        "pops",
        sa.Column("id", sa.BigInteger(), primary_key=True, autoincrement=True),
        sa.Column("zone_id", sa.BigInteger(), sa.ForeignKey("zones.id"), nullable=False),
        sa.Column("name", sa.String(120), nullable=False),
        sa.Column("status", sa.String(32), nullable=False, server_default="online"),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
    )
    op.create_table(
        "devices",
        sa.Column("id", sa.BigInteger(), primary_key=True, autoincrement=True),
        sa.Column("pop_id", sa.BigInteger(), sa.ForeignKey("pops.id"), nullable=True),
        sa.Column("name", sa.String(160), nullable=False),
        sa.Column("device_type", sa.String(32), nullable=False),
        sa.Column("vendor", sa.String(80)),
        sa.Column("model", sa.String(120)),
        sa.Column("management_address", sa.String(255)),
        sa.Column("status", sa.String(32), nullable=False, server_default="unknown"),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
    )
    op.create_table(
        "pon_ports",
        sa.Column("id", sa.BigInteger(), primary_key=True, autoincrement=True),
        sa.Column("olt_device_id", sa.BigInteger(), sa.ForeignKey("devices.id"), nullable=False),
        sa.Column("port_name", sa.String(80), nullable=False),
        sa.Column("status", sa.String(32), nullable=False, server_default="unknown"),
        sa.Column("onu_count", sa.Integer(), nullable=False, server_default="0"),
    )
    op.create_table(
        "onus",
        sa.Column("id", sa.BigInteger(), primary_key=True, autoincrement=True),
        sa.Column("olt_device_id", sa.BigInteger(), sa.ForeignKey("devices.id"), nullable=False),
        sa.Column("pon_port_id", sa.BigInteger(), sa.ForeignKey("pon_ports.id"), nullable=True),
        sa.Column("serial_number", sa.String(120)),
        sa.Column("name", sa.String(160)),
        sa.Column("status", sa.String(32), nullable=False, server_default="unknown"),
        sa.Column("rx_dbm", sa.Numeric(7, 2)),
        sa.Column("tx_dbm", sa.Numeric(7, 2)),
        sa.Column("temperature_c", sa.Numeric(7, 2)),
        sa.Column("distance_m", sa.Integer()),
    )
    op.create_table(
        "metrics",
        sa.Column("id", sa.BigInteger(), primary_key=True, autoincrement=True),
        sa.Column("device_id", sa.BigInteger(), sa.ForeignKey("devices.id"), nullable=False),
        sa.Column("metric_name", sa.String(120), nullable=False),
        sa.Column("metric_value", sa.Numeric()),
        sa.Column("unit", sa.String(32)),
        sa.Column("recorded_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
    )
    op.create_table(
        "alerts",
        sa.Column("id", sa.BigInteger(), primary_key=True, autoincrement=True),
        sa.Column("device_id", sa.BigInteger(), sa.ForeignKey("devices.id"), nullable=True),
        sa.Column("severity", sa.String(32), nullable=False),
        sa.Column("status", sa.String(32), nullable=False, server_default="open"),
        sa.Column("title", sa.String(255), nullable=False),
        sa.Column("message", sa.Text()),
        sa.Column("detected_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
        sa.Column("resolved_at", sa.DateTime(timezone=True)),
    )
    op.create_index("idx_devices_type", "devices", ["device_type"])
    op.create_index("idx_metrics_device_time", "metrics", ["device_id", "recorded_at"], postgresql_using="btree")
    op.create_index("idx_alerts_status_time", "alerts", ["status", "detected_at"], postgresql_using="btree")

    op.create_table(
        "roles",
        sa.Column("id", sa.BigInteger(), primary_key=True, autoincrement=True),
        sa.Column("name", sa.String(80), nullable=False, unique=True),
        sa.Column("description", sa.Text()),
    )
    op.create_table(
        "users",
        sa.Column("id", sa.BigInteger(), primary_key=True, autoincrement=True),
        sa.Column("username", sa.String(120), nullable=False, unique=True),
        sa.Column("password_hash", sa.Text(), nullable=False),
        sa.Column("is_active", sa.Boolean(), nullable=False, server_default=sa.true()),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
    )
    op.create_table(
        "user_roles",
        sa.Column("user_id", sa.BigInteger(), sa.ForeignKey("users.id", ondelete="CASCADE"), primary_key=True),
        sa.Column("role_id", sa.BigInteger(), sa.ForeignKey("roles.id", ondelete="CASCADE"), primary_key=True),
    )
    op.create_table(
        "device_credentials",
        sa.Column("id", sa.BigInteger(), primary_key=True, autoincrement=True),
        sa.Column("device_id", sa.BigInteger(), sa.ForeignKey("devices.id", ondelete="CASCADE"), nullable=False, unique=True),
        sa.Column("secret_ref", sa.String(255), nullable=False),
        sa.Column("auth_mode", sa.String(40), nullable=False, server_default="secret-ref"),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
    )
    op.create_table(
        "audit_logs",
        sa.Column("id", sa.BigInteger(), primary_key=True, autoincrement=True),
        sa.Column("user_id", sa.BigInteger(), sa.ForeignKey("users.id"), nullable=True),
        sa.Column("action", sa.String(120), nullable=False),
        sa.Column("resource_type", sa.String(80)),
        sa.Column("resource_id", sa.BigInteger()),
        sa.Column("details", postgresql.JSONB()),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
    )
    op.create_index("idx_audit_logs_time", "audit_logs", ["created_at"], postgresql_using="btree")

    op.execute(sa.text("INSERT INTO roles (name, description) VALUES (:name, :description) ON CONFLICT (name) DO NOTHING").bindparams(name="admin", description="Full platform administration"))
    op.execute(sa.text("INSERT INTO roles (name, description) VALUES (:name, :description) ON CONFLICT (name) DO NOTHING").bindparams(name="operator", description="Network operations and monitoring"))
    op.execute(sa.text("INSERT INTO roles (name, description) VALUES (:name, :description) ON CONFLICT (name) DO NOTHING").bindparams(name="viewer", description="Read-only monitoring access"))


def downgrade() -> None:
    op.drop_index("idx_audit_logs_time", table_name="audit_logs")
    op.drop_table("audit_logs")
    op.drop_table("device_credentials")
    op.drop_table("user_roles")
    op.drop_table("users")
    op.drop_table("roles")
    op.drop_index("idx_alerts_status_time", table_name="alerts")
    op.drop_index("idx_metrics_device_time", table_name="metrics")
    op.drop_index("idx_devices_type", table_name="devices")
    op.drop_table("alerts")
    op.drop_table("metrics")
    op.drop_table("onus")
    op.drop_table("pon_ports")
    op.drop_table("devices")
    op.drop_table("pops")
    op.drop_table("zones")
