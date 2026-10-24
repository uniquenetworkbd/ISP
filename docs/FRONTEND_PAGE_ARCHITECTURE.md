# ISP Monitoring Frontend — Final Page Architecture v1.1

## Purpose

This document defines the single-page application information architecture for the ISP Monitoring frontend. All functional views share one Application Shell; feature modules own their page content and interactions.

## Core hierarchy

```text
ISP Monitoring Application
├── Application Shell
│   ├── Sidebar / Topbar
│   ├── Global Search / Command Palette
│   ├── Notifications / User Menu
│   └── Shared Toast / UI State
├── Command Center
├── Network Visualization
│   ├── Interactive Topology
│   └── Network Map
├── Infrastructure Monitoring
│   ├── MikroTik
│   ├── OLT / PON
│   ├── ONU
│   └── Interfaces
├── Operations
│   ├── Alerts
│   ├── Analytics
│   └── Reports
├── Management
│   ├── Devices
│   └── System
└── Future Platform
    ├── Backend Data Layer
    ├── Authentication / RBAC
    ├── Real Telemetry
    └── Automation / Integrations
```

## Route map

| Area | Route | State |
|---|---|---|
| Command Center | `#dashboard` | Complete |
| Topology | `#topology` | Complete |
| Network Map | `#map` | Complete |
| MikroTik | `#mikrotik` | Complete |
| OLT / PON | `#olt` | Complete |
| ONU | `#onu` | Complete |
| Interfaces | `#interfaces` | Complete |
| Alerts | `#alerts` | Complete |
| Analytics | `#analytics` | Complete |
| Reports | `#reports` | UI complete / data service future |
| Devices | `#devices` | UI complete / data service future |
| System | `#system` | UI complete / auth service future |

## Current data boundary

The project is still frontend-only. Dashboard and management screens use structured demonstration data. No backend, database, RouterOS, OLT/ONU, API, WebSocket or scheduled telemetry service is connected.

The frontend is deliberately organized so a future API/data adapter can replace demonstration datasets without changing the page hierarchy.

## Management layer status

Step 12 now includes:

- Device inventory with search and type filters
- Device detail selection
- Users and roles workspace
- Audit log workspace
- Configuration workspace
- Monitoring threshold display
- Frontend-only management boundary messaging
- Responsive management tables

Reports now include a dedicated report workspace with report templates and preview interactions. Export, scheduling and historical aggregation remain backend/data-service responsibilities.

## Frontend completion gate

Core monitoring pages, shared navigation architecture, management UI and report UI are implemented. Remaining frontend work is primarily consolidation/QA: unified loading/empty/error/offline states, final responsive/accessibility QA, global interaction consistency, data-adapter contracts and final browser verification.
