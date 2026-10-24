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
| 12 | Device Management + System UI | Planned |
| 13 | Final UI Integration | Planned |
| 14 | Responsive + UX Polish | Planned |
| 15 | Final Frontend QA | Planned |

## Step 11 scope

Analytics & Reports provides a frontend analysis layer for aggregate traffic trends, layer health, zone comparison and report-ready summaries. It includes period filters, trend visualization, zone performance tables and report preview actions.

## Data boundary

The current application remains frontend-only. Step 11 metrics and report previews use representative demonstration values. No backend, database, RouterOS, OLT/ONU, API, WebSocket or scheduled reporting service is connected.

The information architecture is intentionally backend-ready so a later data layer can map real interface, router, optical, ONU and alert telemetry into the same analytics views without redesigning the UI structure.

## Evidence model

RouterOS supports historical graphing for interface traffic and system resources, while interface statistics expose RX/TX packets, queue drops and link-down counters; these concepts inform the frontend analytics model. citeturn0search0turn0search1
