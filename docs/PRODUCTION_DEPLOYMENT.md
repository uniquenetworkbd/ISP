# ISP NOC Production Deployment

This project is split into a static GitHub Pages frontend and a separate FastAPI/PostgreSQL API service.

## Target topology

```text
Browser
  |
  | HTTPS
  v
GitHub Pages frontend
  |
  | HTTPS API calls
  v
api.example.com (Caddy)
  |
  v
FastAPI backend
  |
  v
PostgreSQL 16
  |
  +--> monitoring workers / collectors
  |
  +--> MikroTik / OLT connections
```

## Production stack included in this repository

- `backend/Dockerfile` — FastAPI image.
- `docker-compose.production.yml` — PostgreSQL + backend + Caddy.
- `deploy/Caddyfile` — HTTPS reverse proxy configuration.
- `backend/.env.production.example` — production variable template.
- `backend/alembic` — database migrations.
- `/health/ready` — database-backed readiness check.

## Required deployment steps

1. Provision a Linux host with Docker Engine and Compose.
2. Create `backend/.env.production` from `backend/.env.production.example`.
3. Set a long random PostgreSQL password, JWT secret, and Fernet credential-encryption key. Do not commit them.
4. Set `API_DOMAIN` to the API hostname and point its DNS A/AAAA record at the deployment host.
5. Set `ALLOWED_ORIGINS` to the exact production frontend origin(s).
6. Start the stack with `docker compose -f docker-compose.production.yml up -d --build`.
7. Confirm `docker compose ps` reports PostgreSQL and backend healthy.
8. Confirm `https://<API_DOMAIN>/health` and `https://<API_DOMAIN>/health/ready` respond successfully.
9. Configure the frontend API origin using the project's API configuration mechanism; do not hard-code secrets into frontend files.
10. Run browser smoke tests and API tests against the deployed environment before connecting physical network devices.

## Secret rules

Never put real database passwords, JWT secrets, Fernet keys, MikroTik credentials, SNMP communities, or device addresses into Git. Store them only on the deployment host or in the deployment platform's secret manager.

## Rollback

Keep the previous application image/tag available. Before a schema change, take a PostgreSQL backup. If a release fails, restore the previous image and use the database backup according to the migration's rollback plan. Do not blindly downgrade production migrations that contain destructive changes.

## Device connection gate

Real MikroTik and OLT connections are intentionally the final integration stage. First require:

- CI green on the release candidate commit.
- Browser smoke tests green.
- Production API `/health/ready` green.
- Database migrations applied successfully.
- Authentication and authorization verified.
- Frontend-to-API HTTPS calls verified.
- Connection-center save/test/history actions verified.

Only after these checks should real device information be entered.
