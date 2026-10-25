# Frontend ↔ API Integration

## Current state

The static frontend now has a backend-neutral API client and a centralized API data store.

```text
UI Views
  ↓
api-ui-bridge.js
  ↓
api-store.js
  ↓
api-client.js
  ↓
FastAPI /api/*
```

## API coverage

- Authentication: login, current user, roles, logout token removal
- Devices: list, detail, create
- Monitoring: health, summary, metrics, alerts
- Alert operations: acknowledge, resolve
- Network: zones, POPs, topology
- Database: health

## Configuration boundary

`js/api-config.js` contains the runtime backend origin:

```js
window.ISPApp.api = {
  baseUrl: '',
  tokenKey: 'isp_access_token',
};
```

An empty `baseUrl` intentionally keeps the GitHub Pages frontend backend-neutral. Once the FastAPI backend is deployed, only this configuration boundary needs to point at that backend origin; the information architecture and UI routes do not need to change.

## Authentication

Successful login stores only the issued bearer access token in browser local storage under `isp_access_token`. Plaintext passwords are never persisted by the frontend API client.

## Demo/API boundary

If no API base URL is configured, the existing static/demo UI remains active. When an API base URL is configured and the backend is reachable/authenticated, `api-store.js` loads summary, devices, alerts, metrics and topology data and `api-ui-bridge.js` binds supported command-center values to live API state.

This repository does **not** claim live backend connectivity until a real backend deployment URL and valid credentials are configured.
