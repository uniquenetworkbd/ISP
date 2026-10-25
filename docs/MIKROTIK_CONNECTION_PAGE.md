# MikroTik Connection Page

The frontend provides a dedicated `#mikrotikServers` connection page.

## Connection flow
1. Enter server name, IP/host, username, password, REST port and timeout.
2. Select access mode and HTTPS/REST transport.
3. Test connection through the configured FastAPI backend.
4. Save and connect the server through the backend.
5. Load stored MikroTik inventory.
6. Scan PPP users and load live telemetry from the backend.

## RouterOS requirements
- RouterOS v7 REST support.
- Prefer `www-ssl` and HTTPS REST.
- A dedicated monitoring account with the required RouterOS policy.
- Network/firewall reachability from the backend to the router.

The GitHub Pages frontend must not directly hold or transmit RouterOS credentials to a private router. The intended path is `Browser → FastAPI → RouterOS REST`.

MikroTik documents REST under `/rest` with HTTP Basic Authentication and recommends HTTPS rather than plain HTTP. See the official RouterOS REST API documentation.
