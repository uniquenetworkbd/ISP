# ISP Monitoring Frontend — Modular Page Architecture v1.2

## Purpose

The frontend uses one application shell with independently addressable feature pages. A module registry now provides a single place to inspect prepared pages, open them by route, and register additional page surfaces without rewriting the shell/navigation layer.

## Page groups

- **Command:** Command Center
- **Visualization:** Interactive Topology, Network Map
- **Infrastructure Monitoring:** MikroTik, MikroTik Servers, OLT/PON, ONU, Interfaces
- **Operations:** Alerts, Analytics, Reports
- **Management:** Devices, System
- **Module System:** Module Manager

## Route map

| Area | Route | Current source state |
|---|---|---|
| Command Center | `#dashboard` | UI implemented; current dashboard contains demonstration values |
| Topology | `#topology` | UI implemented |
| Network Map | `#map` | UI implemented |
| MikroTik | `#mikrotik` | UI + API client contract |
| MikroTik Servers | `#mikrotikServers` | connection form, persistent inventory, scan/live UI + API client contract |
| OLT / PON | `#olt` | UI implemented |
| ONU | `#onu` | UI implemented |
| Interfaces | `#interfaces` | UI implemented |
| Alerts | `#alerts` | UI + API client contract |
| Analytics | `#analytics` | UI + API-ready boundary |
| Reports | `#reports` | UI implemented; backend aggregation/export remains service work |
| Devices | `#devices` | UI + DB-backed API contract |
| System | `#system` | UI + auth/RBAC contract |
| Module Manager | `#modules` | module registry, page inventory, add-module-page UI |

## Module system

`js/components/module-manager.js` maintains a core module catalog and a browser-local custom registry. Each module has a route, title, group, description, UI state and data boundary. The manager can open existing pages and register additional module-page surfaces. Custom registrations are intentionally local to the browser until the corresponding source/module is committed to the repository.

This prevents dynamic browser configuration from being mistaken for source code. A production feature module still requires its JS/CSS/page implementation in the repository.

## Application boot

`js/app.js` loads the module manager before `navigation-architecture.js`. Navigation then groups all required routes, including Module Manager, and the router recognizes both built-in and browser-registered custom module routes.

## Backend / database boundary — verified state

The repository contains a FastAPI backend, SQLAlchemy models, migrations, authentication/RBAC, audit logging, monitoring pipeline and MikroTik connector/API routes. The frontend also contains a centralized API client for those contracts.

**Important live fact:** `js/api-config.js` currently has an empty `baseUrl`. Therefore the GitHub Pages frontend is **not currently connected to a deployed FastAPI origin**. The repository contains the backend/database implementation, but this audit does not claim a live backend/database connection or real-device telemetry until a reachable backend origin is configured and successfully tested.

## Data integrity rule

Dashboard/demo screens may display structured demonstration values. They must not be described as live measurements. MikroTik server inventory/live data is rendered from API responses when the backend is configured; otherwise the UI reports that the backend is not configured instead of fabricating data.

## Completion gate

Frontend page architecture and module registration are implemented. Final live integration remains dependent on a reachable FastAPI deployment and database instance. GitHub Pages deployment only verifies the static frontend build; it does not by itself deploy or expose the FastAPI/database service.
