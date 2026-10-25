from datetime import datetime
from decimal import Decimal

from sqlalchemy import BigInteger, Boolean, DateTime, ForeignKey, Index, Integer, Numeric, String, Text, func
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.orm import DeclarativeBase, Mapped, mapped_column


class Base(DeclarativeBase):
    pass


class Zone(Base):
    __tablename__ = "zones"
    id: Mapped[int] = mapped_column(BigInteger, primary_key=True)
    name: Mapped[str] = mapped_column(String(120), unique=True)
    status: Mapped[str] = mapped_column(String(32), default="online")
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())


class POP(Base):
    __tablename__ = "pops"
    id: Mapped[int] = mapped_column(BigInteger, primary_key=True)
    zone_id: Mapped[int] = mapped_column(ForeignKey("zones.id"))
    name: Mapped[str] = mapped_column(String(120))
    status: Mapped[str] = mapped_column(String(32), default="online")
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())


class Device(Base):
    __tablename__ = "devices"
    __table_args__ = (
        Index("idx_devices_type", "device_type"),
        Index("idx_devices_circuit_state", "circuit_state"),
    )
    id: Mapped[int] = mapped_column(BigInteger, primary_key=True)
    pop_id: Mapped[int | None] = mapped_column(ForeignKey("pops.id"), nullable=True)
    name: Mapped[str] = mapped_column(String(160))
    device_type: Mapped[str] = mapped_column(String(32))
    vendor: Mapped[str | None] = mapped_column(String(80), nullable=True)
    model: Mapped[str | None] = mapped_column(String(120), nullable=True)
    management_address: Mapped[str | None] = mapped_column(String(255), nullable=True)
    status: Mapped[str] = mapped_column(String(32), default="unknown")
    access_mode: Mapped[str] = mapped_column(String(16), default="read", server_default="read")
    timeout_seconds: Mapped[int] = mapped_column(Integer, default=10, server_default="10")
    routeros_version: Mapped[str | None] = mapped_column(String(120), nullable=True)
    last_scan_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    last_live_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    consecutive_failures: Mapped[int] = mapped_column(Integer, default=0, server_default="0")
    circuit_state: Mapped[str] = mapped_column(String(16), default="closed", server_default="closed")
    circuit_opened_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    circuit_next_probe_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    last_failure_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())


class PONPort(Base):
    __tablename__ = "pon_ports"
    id: Mapped[int] = mapped_column(BigInteger, primary_key=True)
    olt_device_id: Mapped[int] = mapped_column(ForeignKey("devices.id"))
    port_name: Mapped[str] = mapped_column(String(80))
    status: Mapped[str] = mapped_column(String(32), default="unknown")
    onu_count: Mapped[int] = mapped_column(Integer, default=0)


class ONU(Base):
    __tablename__ = "onus"
    id: Mapped[int] = mapped_column(BigInteger, primary_key=True)
    olt_device_id: Mapped[int] = mapped_column(ForeignKey("devices.id"))
    pon_port_id: Mapped[int | None] = mapped_column(ForeignKey("pon_ports.id"), nullable=True)
    serial_number: Mapped[str | None] = mapped_column(String(120), nullable=True)
    name: Mapped[str | None] = mapped_column(String(160), nullable=True)
    status: Mapped[str] = mapped_column(String(32), default="unknown")
    rx_dbm: Mapped[Decimal | None] = mapped_column(Numeric(7, 2), nullable=True)
    tx_dbm: Mapped[Decimal | None] = mapped_column(Numeric(7, 2), nullable=True)
    temperature_c: Mapped[Decimal | None] = mapped_column(Numeric(7, 2), nullable=True)
    distance_m: Mapped[int | None] = mapped_column(Integer, nullable=True)


class MikroTikUser(Base):
    __tablename__ = "mikrotik_users"
    __table_args__ = (
        Index("idx_mikrotik_users_device", "device_id"),
        Index("idx_mikrotik_users_username", "username"),
        Index("idx_mikrotik_users_status", "status_snapshot"),
    )
    id: Mapped[int] = mapped_column(BigInteger, primary_key=True)
    device_id: Mapped[int] = mapped_column(ForeignKey("devices.id", ondelete="CASCADE"), nullable=False)
    username: Mapped[str] = mapped_column(String(160), nullable=False)
    customer_name: Mapped[str | None] = mapped_column(String(200), nullable=True)
    service_profile: Mapped[str | None] = mapped_column(String(160), nullable=True)
    service: Mapped[str | None] = mapped_column(String(40), nullable=True)
    assigned_ip: Mapped[str | None] = mapped_column(String(80), nullable=True)
    caller_id: Mapped[str | None] = mapped_column(String(120), nullable=True)
    status_snapshot: Mapped[str] = mapped_column(String(32), default="unknown", server_default="unknown")
    last_live_ip: Mapped[str | None] = mapped_column(String(80), nullable=True)
    last_live_uptime: Mapped[str | None] = mapped_column(String(80), nullable=True)
    metadata_json: Mapped[dict | None] = mapped_column(JSONB, nullable=True)
    first_seen_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    last_seen_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    last_synced_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())


class Metric(Base):
    __tablename__ = "metrics"
    __table_args__ = (Index("idx_metrics_device_time", "device_id", "recorded_at"),)
    id: Mapped[int] = mapped_column(BigInteger, primary_key=True)
    device_id: Mapped[int] = mapped_column(ForeignKey("devices.id"))
    metric_name: Mapped[str] = mapped_column(String(120))
    metric_value: Mapped[Decimal | None] = mapped_column(Numeric, nullable=True)
    unit: Mapped[str | None] = mapped_column(String(32), nullable=True)
    recorded_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())


class Alert(Base):
    __tablename__ = "alerts"
    __table_args__ = (Index("idx_alerts_status_time", "status", "detected_at"),)
    id: Mapped[int] = mapped_column(BigInteger, primary_key=True)
    device_id: Mapped[int | None] = mapped_column(ForeignKey("devices.id"), nullable=True)
    severity: Mapped[str] = mapped_column(String(32))
    status: Mapped[str] = mapped_column(String(32), default="open")
    title: Mapped[str] = mapped_column(String(255))
    message: Mapped[str | None] = mapped_column(Text, nullable=True)
    detected_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    resolved_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)


class Role(Base):
    __tablename__ = "roles"
    id: Mapped[int] = mapped_column(BigInteger, primary_key=True)
    name: Mapped[str] = mapped_column(String(80), unique=True)
    description: Mapped[str | None] = mapped_column(Text, nullable=True)


class User(Base):
    __tablename__ = "users"
    id: Mapped[int] = mapped_column(BigInteger, primary_key=True)
    username: Mapped[str] = mapped_column(String(120), unique=True)
    password_hash: Mapped[str] = mapped_column(Text)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())


class UserRole(Base):
    __tablename__ = "user_roles"
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), primary_key=True)
    role_id: Mapped[int] = mapped_column(ForeignKey("roles.id", ondelete="CASCADE"), primary_key=True)


class DeviceCredential(Base):
    __tablename__ = "device_credentials"
    id: Mapped[int] = mapped_column(BigInteger, primary_key=True)
    device_id: Mapped[int] = mapped_column(ForeignKey("devices.id", ondelete="CASCADE"), unique=True)
    secret_ref: Mapped[str] = mapped_column(String(255))
    auth_mode: Mapped[str] = mapped_column(String(40), default="encrypted-db")
    encrypted_username: Mapped[str | None] = mapped_column(Text, nullable=True)
    encrypted_password: Mapped[str | None] = mapped_column(Text, nullable=True)
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())


class AuditLog(Base):
    __tablename__ = "audit_logs"
    __table_args__ = (Index("idx_audit_logs_time", "created_at"),)
    id: Mapped[int] = mapped_column(BigInteger, primary_key=True)
    user_id: Mapped[int | None] = mapped_column(ForeignKey("users.id"), nullable=True)
    action: Mapped[str] = mapped_column(String(120))
    resource_type: Mapped[str | None] = mapped_column(String(80), nullable=True)
    resource_id: Mapped[int | None] = mapped_column(BigInteger, nullable=True)
    details: Mapped[dict | None] = mapped_column(JSONB, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
