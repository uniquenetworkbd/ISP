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
| 11 | Analytics & Reports | Planned |
| 12 | Device Management + System UI | Planned |
| 13 | Final UI Integration | Planned |
| 14 | Responsive + UX Polish | Planned |
| 15 | Final Frontend QA | Planned |

## Step 10 scope

Alert Center provides a frontend investigation layer for Critical, Warning and Info events with Open/Acknowledged/Resolved state, severity/status filters, search, and selected-alert investigation context covering source device, zone, event type, time, path and recommended action.

## Data boundary

The current application remains frontend-only. Alert records in Step 10 are representative demonstration data. Acknowledge/Resolve actions change only browser-side demonstration state; no backend, database, RouterOS, OLT/ONU, API, WebSocket or notification service is connected.

The UI structure is intentionally backend-ready so a later data layer can map real events into the same alert model without redesigning the information architecture.
