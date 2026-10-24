# ISP Monitoring — Frontend UI System

The frontend uses the Foundation design tokens and the Application Shell navigation model.

## Shell regions
- Sidebar: workspace and system navigation
- Topbar: page context, global search, notifications and user controls
- Workspace: route target for monitoring modules
- Overlay layer: command palette and popovers

## Interaction model
- Hash routes keep the first release static and backend-independent.
- Shared state is exposed through `window.ISPApp.state`.
- Shell modules are isolated under `js/components/` for later expansion.
