# Database Migrations

This directory contains the versioned database migration environment for the ISP NOC backend.

- Configuration: `../alembic.ini`
- Environment: `env.py`
- Revisions: `versions/`
- Target metadata: `backend/app/models.py`

Typical commands from `backend/`:

```bash
alembic history
alembic current
alembic upgrade head
alembic downgrade -1
alembic check
```

The migration layer is source-controlled with the application. It does not connect to an external platform by itself; a database URL is required only when a migration is actually executed.
