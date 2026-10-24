# Topology Frontend Data Contract

## Purpose

The Topology UI is a frontend visualization layer. It must remain fully usable with demo/static data and must not depend on a backend or database for layout, interaction, filtering, or rendering.

## Canonical model

`window.ISPApp.topologyModel` contains:

- `version`
- `nodes[]`
- `edges[]`

### Node

```text
id       Stable frontend/entity identifier
 type     Core | Switch | OLT | ONU | Customer
name     Display name
detail   Device/location detail
status   Online | Warning | Offline
level    Topology hierarchy level
x, y     Frontend layout coordinates
meta     Supporting display metadata
```

### Edge

```text
id       Stable edge identifier
source   Source node id
target   Target node id
type     uplink | fiber | pon | ethernet
status   Online | Warning | Offline
```

## Rendering rule

The SVG graph, node cards, filters, selection state, status display, detail panel and path display must derive from the same model. HTML must not contain an independent set of topology relationships.

## Backend-ready boundary

A future API adapter may replace the demo model with API data without changing the visual components. Backend/database integration is intentionally outside the current frontend implementation.

## Relationship rule

Each edge explicitly declares `source` and `target`. UI logic must never infer relationships by splitting edge IDs or display strings.

## Responsive rule

The desktop graph uses a fixed logical coordinate space with internal canvas scrolling. Mobile must preserve readable node cards and provide horizontal/vertical pan rather than shrinking the complete graph into unreadable text.

## Interaction requirements

- Node selection updates the detail panel.
- Connected edges are highlighted.
- Filters use node `type` and edge `source`/`target` fields.
- Zoom controls must not modify the logical topology model.
- Status styling is derived from node/edge status.
