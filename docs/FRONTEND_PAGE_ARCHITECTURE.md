# ISP Monitoring Frontend — Final Page Architecture v1.0

## Purpose

This document consolidates the frontend work completed through Step 11 into one clear application information architecture before Step 12 begins.

The project is a single ISP Monitoring application with one shared Application Shell and multiple functional Pages/Views. A Page/View is a distinct workspace; it does not require a separate standalone website or duplicated HTML shell.

## Core hierarchy

```text
ISP Monitoring Application
│
├── Application Shell
│   ├── Sidebar / Primary Navigation
│   ├── Topbar / Page Header
│   ├── Global Search
│   ├── Notifications
│   ├── User Menu
│   └── Global Toast / UI State
│
├── 01. Command Center
│   ├── KPI Summary
│   ├── Traffic Overview
│   ├── Network Health
│   ├── Infrastructure Status
│   └── Recent Events
│
├── 02. Network Visualization
│   ├── Interactive Topology
│   └── Network Zone & POP Map
│
├── 03. Infrastructure Monitoring
│   ├── MikroTik Dashboard
│   ├── OLT / PON Dashboard
│   ├── ONU Monitoring
│   └── Interface Monitoring
│
├── 04. Operations
│   ├── Alert Center
│   └── Analytics & Reports
│
├── 05. Management
│   ├── Device Management        [Step 12]
│   ├── Users / Roles            [Step 12]
│   ├── Audit / System           [Step 12]
│   └── Configuration            [Step 12]
│
└── 06. Platform / Future
    ├── Backend Data Layer       [Future]
    ├── Authentication / RBAC    [Future]
    ├── Real Telemetry           [Future]
    └── Automation / Integrations[Future]
```

## Page / route map

| Area | Page | Route | Current state |
|---|---|---|---|
| Command | Command Center | `#dashboard` | Complete |
| Visualization | Interactive Topology | `#topology` | Complete |
| Visualization | Network Map | `#map` | Complete |
| Infrastructure | MikroTik Dashboard | `#mikrotik` | Complete |
| Infrastructure | OLT / PON Dashboard | `#olt` | Complete |
| Infrastructure | ONU Monitoring | `#onu` | Complete |
| Infrastructure | Interface Monitoring | `#interfaces` | Complete |
| Operations | Alert Center | `#alerts` | Complete |
| Operations | Analytics | `#analytics` | Complete |
| Operations | Reports | `#reports` | Reserved route / future expansion |
| Management | Device Management | `#devices` | Step 12 |
| Management | System | `#system` | Step 12 |

## Page design rule

Each major capability owns one primary Page/View. Within that Page, related information is grouped into sections, cards, tables, charts, filters and detail panels.

Example:

```text
MikroTik Dashboard
├── Fleet KPI
├── Router Fleet Table
├── Filters
├── Resource Health
└── Selected Router Detail
```

This keeps the page focused while avoiding a large number of tiny pages.

## Shared shell rule

All pages use the same Application Shell. The shell owns navigation and global UI behavior; feature modules own only their page content and feature-specific interactions.

```text
Shared Shell
   ↓
Router / Route State
   ↓
Page/View
   ↓
Feature Module
   ↓
Sections + Components
   ↓
Future Data Adapter
```

## Navigation implementation

The sidebar now follows the page groups defined above:

```text
Command
  Command Center
Visualization
  Topology
  Network Map
Infrastructure Monitoring
  MikroTik
  OLT / PON
  ONU Monitoring
  Interfaces
Operations
  Alerts
  Analytics
  Reports
Management
  Devices
  System
```

The grouping is applied by `js/components/navigation-architecture.js` after all feature navigation items are available. This allows dynamically loaded monitoring modules to remain independent while the shared shell presents one consistent navigation hierarchy. The command palette is aligned to the same route map.

## Data boundary

The current project remains frontend-only. Current dashboards contain representative demonstration values. No backend, database, RouterOS, OLT/ONU, API, WebSocket or scheduled telemetry service is connected.

The architecture deliberately keeps page structure independent from the future data source so real telemetry can later populate the same views.

## Navigation principles

1. Command Center is the default landing page.
2. Visualization pages answer “where is the network and how is it connected?”.
3. Infrastructure pages answer “what is happening inside each network layer?”.
4. Operations pages answer “what needs attention and what does the trend show?”.
5. Management pages will answer “what devices, users, configuration and audit state exist?”.
6. Global navigation must remain stable while individual page content evolves.
7. A feature should not create a second Application Shell.
8. A future backend must provide data to existing page contracts rather than forcing an information-architecture rewrite.

## Consolidation status

Steps 01–11 are retained as completed implementation layers. This architecture pass does not discard them; it reorganizes their presentation and ownership into a coherent page model.

### Current implementation mapping

- Step 01–02 → Foundation + shared Application Shell
- Step 03 → Command Center page
- Step 04 → Interactive Topology page
- Step 05 → Network Map page
- Step 06 → MikroTik page
- Step 07 → OLT/PON page
- Step 08 → ONU page
- Step 09 → Interface page
- Step 10 → Alert Center page
- Step 11 → Analytics & Reports operations layer
- Step 11A → Page navigation architecture implementation
- Step 12 → Device Management + System UI

## Completion gate before Step 12

The page architecture and shared navigation hierarchy are now defined and implemented. Step 12 can proceed without changing the fundamental application shell or page hierarchy.
