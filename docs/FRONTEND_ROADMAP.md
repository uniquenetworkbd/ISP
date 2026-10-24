# ISP Monitoring Frontend Roadmap

| Step | Layer | Status |
|---|---|---|
| 01 | Frontend Foundation | Complete |
| 02 | Application Shell | Complete |
| 03 | Command Center | Complete |
| 04 | Interactive Topology | Complete |
| 05 | Network Map | Complete |
| 06 | MikroTik Dashboard | Complete |
| 07 | OLT/PON Dashboard | Complete |
| 08 | ONU Monitoring | Complete |
| 09 | Interface Monitoring | Complete |
| 10 | Alert Center | Complete |
| 11 | Analytics & Reports | Complete |
| 11A | Page Architecture Consolidation | Complete |
| 12 | Device Management + System UI | Planned |
| 13 | Final UI Integration | Planned |
| 14 | Responsive + UX Polish | Planned |
| 15 | Final Frontend QA | Planned |

## Step 11 — Analytics & Reports

Analytics & Reports provides a frontend analysis layer for aggregate traffic trends, layer health, zone comparison and report-ready summaries. It includes period filters, trend visualization, zone performance tables and report preview actions.

## Step 11A — Page Architecture Consolidation

Before starting Step 12, the completed frontend layers were reorganized into a single information architecture. Each major capability now has one defined Page/View responsibility while the Application Shell remains shared.

### Page groups

- **Command:** Command Center
- **Visualization:** Interactive Topology, Network Map
- **Infrastructure:** MikroTik, OLT/PON, ONU, Interfaces
- **Operations:** Alert Center, Analytics, Reports
- **Management:** Device Management, Users/Roles, Audit/System, Configuration — Step 12 scope
- **Platform/Future:** backend data, authentication/RBAC, telemetry and automation — future scope

The detailed hierarchy and route map are documented in `docs/FRONTEND_PAGE_ARCHITECTURE.md`.

### Architecture rule

The application follows:

`Application → Shared Shell → Route/Page → Sections → Components → Future Data Adapter`

A major capability is treated as a distinct Page/View, but pages share the same shell and do not duplicate the application structure. This keeps the UI understandable now and backend-ready later.

## Data boundary

The current application remains frontend-only. Dashboard, monitoring and analytics values are representative demonstration data. No backend, database, RouterOS, OLT/ONU, API, WebSocket or scheduled telemetry service is connected.

The information architecture is intentionally backend-ready so a later data layer can populate the same pages without redesigning the application hierarchy.
