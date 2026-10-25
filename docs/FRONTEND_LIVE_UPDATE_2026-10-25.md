# Frontend live update — 2026-10-25

Implemented on `main`:

- deterministic menu registry v2
- dedicated MikroTik connection/login page UI
- RouterOS connection form with host, username, password, REST port, timeout, access mode and transport
- test connection and save/connect actions wired to the existing API client boundary
- runtime cache/build version bumped to `2026.10.25.2205`
- MikroTik connection architecture documented as Browser → FastAPI → RouterOS REST

Deployment is performed by the repository's GitHub Pages Actions workflow on `main`.
