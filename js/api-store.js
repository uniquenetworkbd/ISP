window.ISPApp = window.ISPApp || {};
(function () {
  const stateKey = 'isp_api_state';
  const initialState = { mode: 'unconfigured', connected: false, backend: false, loading: false, error: null, summary: null, devices: [], metrics: [], alerts: [], topology: null, mikrotikServers: [] };
  function publish(patch) {
    window.ISPApp.apiState = Object.assign(window.ISPApp.apiState || initialState, patch);
    window.dispatchEvent(new CustomEvent('isp:api-state', { detail: window.ISPApp.apiState }));
    return window.ISPApp.apiState;
  }
  async function loadMikroTikServers() {
    const api = window.ISPApp.apiClient;
    if (!api?.isConfigured()) return publish({ mikrotikServers: [], mikrotikLoading: false });
    publish({ mikrotikLoading: true, error: null });
    try {
      const result = await api.mikrotikServers();
      const next = publish({ mikrotikServers: result?.items || [], mikrotikLoading: false });
      try { localStorage.setItem(stateKey, JSON.stringify(next)); } catch (_) {}
      return next.mikrotikServers;
    } catch (error) {
      publish({ mikrotikLoading: false, error: error.message || 'MikroTik inventory unavailable' });
      throw error;
    }
  }
  async function sync() {
    const api = window.ISPApp.apiClient;
    if (!api?.isConfigured()) return publish({ mode: 'unconfigured', connected: false, backend: false, loading: false, error: null });
    publish({ mode: 'connecting', connected: false, backend: false, loading: true, error: null });
    try {
      const backendStatus = await api.systemStatus();
      const [summary, devices, alerts, metrics, topology] = await Promise.all([
        api.monitoringSummary(), api.listDevices(), api.alerts({ limit: 200 }), api.metrics({ limit: 200 }), api.topology(),
      ]);
      const next = publish({ mode: 'live', connected: true, backend: true, loading: false, error: null, backendStatus, summary, devices: devices?.items || devices || [], alerts: alerts?.items || [], metrics: metrics?.items || [], topology });
      try { localStorage.setItem(stateKey, JSON.stringify(next)); } catch (_) {}
      return next;
    } catch (error) {
      publish({ mode: 'error', connected: false, backend: false, loading: false, error: error.message || 'API unavailable' });
      throw error;
    }
  }
  function restore() {
    try {
      const saved = JSON.parse(localStorage.getItem(stateKey) || 'null');
      if (saved && saved.mode === 'live') publish({ ...saved, loading: false });
    } catch (_) {}
  }
  window.ISPApp.apiStore = { sync, restore, publish, loadMikroTikServers };
  restore();
  window.addEventListener('isp:app-ready', () => {
    setTimeout(() => sync().catch(() => {}), 0);
    // Keep backend-backed widgets fresh while the dashboard is open; API requests already have timeouts.
    window.setInterval(() => {
      if (document.visibilityState === 'visible' && window.ISPApp.apiClient?.isConfigured()) {
        sync().catch(() => {});
      }
    }, 30000);
  }, { once: true });
  window.addEventListener('focus', () => {
    if (window.ISPApp.apiClient?.isConfigured()) sync().catch(() => {});
  });
})();
