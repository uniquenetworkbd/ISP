CREATE TABLE IF NOT EXISTS zones (
    id BIGSERIAL PRIMARY KEY,
    name VARCHAR(120) NOT NULL UNIQUE,
    status VARCHAR(32) NOT NULL DEFAULT 'online',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS pops (
    id BIGSERIAL PRIMARY KEY,
    zone_id BIGINT NOT NULL REFERENCES zones(id),
    name VARCHAR(120) NOT NULL,
    status VARCHAR(32) NOT NULL DEFAULT 'online',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS devices (
    id BIGSERIAL PRIMARY KEY,
    pop_id BIGINT REFERENCES pops(id),
    name VARCHAR(160) NOT NULL,
    device_type VARCHAR(32) NOT NULL,
    vendor VARCHAR(80),
    model VARCHAR(120),
    management_address VARCHAR(255),
    status VARCHAR(32) NOT NULL DEFAULT 'unknown',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS pon_ports (
    id BIGSERIAL PRIMARY KEY,
    olt_device_id BIGINT NOT NULL REFERENCES devices(id),
    port_name VARCHAR(80) NOT NULL,
    status VARCHAR(32) NOT NULL DEFAULT 'unknown',
    onu_count INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS onus (
    id BIGSERIAL PRIMARY KEY,
    olt_device_id BIGINT NOT NULL REFERENCES devices(id),
    pon_port_id BIGINT REFERENCES pon_ports(id),
    serial_number VARCHAR(120),
    name VARCHAR(160),
    status VARCHAR(32) NOT NULL DEFAULT 'unknown',
    rx_dbm NUMERIC(7,2),
    tx_dbm NUMERIC(7,2),
    temperature_c NUMERIC(7,2),
    distance_m INTEGER
);

CREATE TABLE IF NOT EXISTS metrics (
    id BIGSERIAL PRIMARY KEY,
    device_id BIGINT NOT NULL REFERENCES devices(id),
    metric_name VARCHAR(120) NOT NULL,
    metric_value NUMERIC,
    unit VARCHAR(32),
    recorded_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS alerts (
    id BIGSERIAL PRIMARY KEY,
    device_id BIGINT REFERENCES devices(id),
    severity VARCHAR(32) NOT NULL,
    status VARCHAR(32) NOT NULL DEFAULT 'open',
    title VARCHAR(255) NOT NULL,
    message TEXT,
    detected_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    resolved_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_devices_type ON devices(device_type);
CREATE INDEX IF NOT EXISTS idx_metrics_device_time ON metrics(device_id, recorded_at DESC);
CREATE INDEX IF NOT EXISTS idx_alerts_status_time ON alerts(status, detected_at DESC);
