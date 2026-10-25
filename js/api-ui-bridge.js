window.ISPApp = window.ISPApp || {};

(function () {
  function setText(element, value) {
    if (element && value != null) element.textContent = String(value);
  }

  function render(state) {
    if (!state?.connected || !state.summary) return;
    const summary = state.summary;
    const devices = Array.isArray(state.devices) ? state.devices : [];
    const kpis = document.querySelectorAll('.command-kpi .kpi-value');
    const onlineRatio = summary.total_devices ? (summary.online_devices / summary.total_devices) * 100 : 0;
    const olts = devices.filter((device) => String(device.device_type || '').toLowerCase() === 'olt');
    const onlineOnu = devices.filter((device) => String(device.device_type || '').toLowerCase() === 'onu' && device.status === 'online').length;
    const onlineOlts = olts.filter((device) => device.status === 'online').length;

    setText(kpis[0], `${Math.round(onlineRatio * 10) / 10}%`);
    setText(kpis[1], `${summary.online_devices} / ${summary.total_devices}`);
    setText(kpis[2], `${onlineOlts} / ${olts.length}`);
    setText(kpis[3], onlineOnu);

    const statusTiles = document.querySelectorAll('.status-tile strong');
    setText(statusTiles[0], `${summary.online_devices} online`);
    setText(statusTiles[1], `${onlineOlts} online`);
    setText(statusTiles[2], `${onlineOnu} online`);
    setText(statusTiles[4], `${summary.open_alerts} active`);
    const sidebarCount = document.querySelector('[data-route="alerts"] .nav-count');
    setText(sidebarCount, summary.open_alerts);
  }

  window.addEventListener('isp:api-state', (event) => render(event.detail));
  if (window.ISPApp.apiState) render(window.ISPApp.apiState);
})();
