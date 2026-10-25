window.ISPApp = window.ISPApp || {};

(function () {
  function setText(element, value) {
    if (element && value != null) element.textContent = String(value);
  }

  function render(state) {
    if (!state?.connected || !state.summary) return;
    const summary = state.summary;
    const kpis = document.querySelectorAll('.command-kpi .kpi-value');
    setText(kpis[0], `${Math.round((summary.total_devices ? (summary.online_devices / summary.total_devices) * 100 : 0) * 10) / 10}%`);
    setText(kpis[1], `${summary.online_devices} / ${summary.total_devices}`);
    setText(kpis[2], state.topology?.pops?.length ?? 0);
    const onlineOnu = state.devices.filter((device) => String(device.device_type || '').toLowerCase() === 'onu' && device.status === 'online').length;
    setText(kpis[3], onlineOnu);

    const statusTiles = document.querySelectorAll('.status-tile strong');
    setText(statusTiles[0], `${summary.online_devices} online`);
    setText(statusTiles[4], `${summary.open_alerts} active`);
    const sidebarCount = document.querySelector('[data-route="alerts"] .nav-count');
    setText(sidebarCount, summary.open_alerts);
  }

  window.addEventListener('isp:api-state', (event) => render(event.detail));
  if (window.ISPApp.apiState) render(window.ISPApp.apiState);
})();
