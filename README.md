# ISP Monitoring — Network Operations Center

Frontend-first ISP monitoring platform with a FastAPI/PostgreSQL backend foundation, MikroTik RouterOS integration, and a generic SNMPv2c OLT system probe.

## Current architecture

- **Frontend:** static HTML/CSS/JavaScript, deployed to GitHub Pages.
- **Backend:** FastAPI, JWT authentication, role-based API access, SQLAlchemy and Alembic.
- **Database:** PostgreSQL 16; schema migrations run before the backend starts in Docker Compose.
- **MikroTik:** RouterOS REST connector and encrypted credential inventory.
- **OLT:** generic SNMPv2c connectivity/system probe (sysDescr, sysName, sysUpTime) and encrypted community storage.
- **Monitoring worker:** separate Compose service for scheduled collection.
- **CI:** backend integration tests run against a PostgreSQL service; Pages deployment checks frontend JavaScript syntax.

## Run backend locally

Requirements: Docker Engine with the Compose plugin.

1. Copy **backend/.env.example** to **backend/.env**.
2. Replace the development database password, JWT secret and credential-encryption key with strong generated values. Keep the real .env file out of Git.
3. From the repository root, run:

   ```bash
   cd backend
   docker compose up --build -d
   ```

4. Verify:
   - http://localhost:8000/health
   - http://localhost:8000/health/ready
   - http://localhost:8000/docs

Compose starts PostgreSQL, runs Alembic migrations, then starts the API and monitoring worker.

## Production configuration guard

Set `APP_ENV=production` only after configuring a reachable production PostgreSQL host, an HTTPS-only exact `ALLOWED_ORIGINS` list, a unique random `JWT_SECRET` (at least 32 characters), and a valid generated Fernet `CREDENTIAL_ENCRYPTION_KEY`. In production mode the API refuses to start when these critical settings are missing or unsafe. Keep real secrets in the host's secret manager/environment, never in Git.

Generate a Fernet key with:

```bash
python -c "from cryptography.fernet import Fernet; print(Fernet.generate_key().decode())"
```

## Create the first administrator

Run this on the backend host, after the database migrations have completed. Set a unique username and a strong password in the environment; do not commit real credentials.

```bash
cd backend
export BOOTSTRAP_ADMIN_USERNAME='your-admin-user'
export BOOTSTRAP_ADMIN_PASSWORD='use-a-unique-password-of-at-least-14-characters'
docker compose run --rm -e BOOTSTRAP_ADMIN_USERNAME -e BOOTSTRAP_ADMIN_PASSWORD backend python -m app.bootstrap_admin
unset BOOTSTRAP_ADMIN_PASSWORD
```

The command creates the initial admin and standard role records. It refuses to overwrite an existing username.

## Connect GitHub Pages to the deployed API

GitHub Pages cannot run FastAPI or PostgreSQL. Deploy the backend and database to a reachable server/container host first, then set the repository Actions **Variable**:

- Name: ISP_API_BASE_URL
- Value: the HTTPS API origin only, for example https://api.example.com (no /api path).

The Pages workflow injects that origin into the built frontend. If the variable is unset, the frontend remains in explicit unconfigured/offline mode. Configure the backend ALLOWED_ORIGINS to include https://uniquenetworkbd.github.io and any other exact frontend origin you use.

## Device setup UI

- **Access & Session:** sign in and verify the server-side identity/roles.
- **Add / Connect MikroTik:** RouterOS REST settings, test connection, encrypted save, user scan and live probe actions.
- **Add / Connect OLT:** save SNMPv2c settings, explicitly test the SNMP probe, list saved profiles, and probe/delete profiles.

Saving an OLT profile does not contact the device. SNMP probing is a separate explicit action.

## Telemetry boundaries

The generic OLT probe verifies SNMPv2c reachability and the standard system OIDs only. Vendor-specific PON port inventory, ONU registration, optical RX/TX levels, temperatures, and vendor alarms need tested Huawei/ZTE/VSOL/BDCOM MIB profiles. The current OLT/ONU dashboards contain demonstration values; those figures must not be interpreted as live network measurements until the vendor collection pipeline is implemented and verified.

The repository cannot verify real device reachability without a configured backend host, routable management path, and valid device-side access configuration. Do not put device credentials in GitHub Pages source or commit them to the repository.

## CI and deployment

- Backend CI: PostgreSQL service → dependency install → Alembic upgrade head → Alembic check → pytest.
- Pages workflow: frontend-only staging → endpoint configuration → JavaScript syntax checks → deployment.
- The backend CI run that covered the initial OLT SNMP connector and system-status probe passed **36 tests**. Later changes are validated by their own workflow runs; check Actions for the latest commit before treating them as accepted.
