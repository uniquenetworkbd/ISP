# Topology Frontend Data Contract

## Purpose

The Topology UI is a frontend visualization layer. It remains usable with demo/static data and does not depend on a backend or database for layout, interaction, filtering, or rendering.

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
meta     Supporting metadata, including optional mapRef/zone
```

Runtime layout derives `x/y` coordinates from `level` and sibling order. Coordinates are presentation state, not source-of-truth topology data.

### Edge

```text
id       Stable edge identifier
source   Source node id
target   Target node id
type     uplink | fiber | pon | ethernet
status   Online | Warning | Offline
```

## Rendering rule

The SVG graph, node cards, filters, selection state, status display, detail panel, path display and branch visibility derive from the same canonical model. The runtime renderer owns SVG relationships; HTML must not define a second relationship model.

## Backend-ready boundary

A future API adapter may replace the demo model with API data without changing the visual components. Backend/database integration is intentionally outside the current frontend implementation.

## Relationship rule

Each edge explicitly declares `source` and `target`. UI logic must never infer relationships by splitting edge IDs or display strings.

## Responsive rule

The graph uses a fixed logical coordinate space with an internally scrollable canvas. Mobile preserves readable node cards and provides horizontal/vertical panning rather than shrinking the complete graph into unreadable text.

## Interaction requirements

- Node selection updates the detail panel.
- Selection highlights the complete connected ancestor/descendant path within the rendered branch.
- Filters use node `type` and edge `source`/`target` fields.
- Zoom controls change presentation scale only and never mutate topology relationships.
- Branch collapse/expand hides or restores descendants without deleting model data.
- Empty and error states are represented explicitly in the UI.
- Stable `mapRef` metadata allows Topology → Network Map navigation.
- Status styling is derived from node/edge status.

## V1.2 frontend behavior

The topology engine now provides:

1. Runtime level-based layout generation.
2. Canonical SVG edge generation.
3. Full ancestor/descendant path highlighting.
4. Zoom, fit and reset controls.
5. Branch collapse/expand controls.
6. Explicit empty/error rendering states.
7. Topology → Network Map entity handoff using stable `mapRef` values.
8. Event-delegated node interaction so re-rendered branches remain interactive.
