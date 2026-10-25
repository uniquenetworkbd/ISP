window.ISPApp = window.ISPApp || {};

(function () {
  const stateKey = 'isp_api_state';
  function publish(patch) {
    window.ISPApp.apiState = Object.assign(window.ISPApp.apiState || {
      mode: 'demo', connected: false, loading: false, error: null,
      summary: null, devices: [], metrics: [], alerts: [], topology: null, mikrotikServers: [],
    }, patch);
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
      try { window.localStorage.setItem(stateKey, JSON.stringify(next)); } catch (_) {}
      return next.mikrotikServers;
    } catch (error) {
      publish({ mikrotikLoading: false, error: error.message || 'MikroTik inventory unavailable' });
      throw error;
    }
  }
  async function sync() {
    const api = window.ISPApp.apiClient;
    if (!api?.isConfigured()) return publish({ mode: 'demo', connected: false, loading: false, error: null });
    publish({ mode: 'api', loading: true, error: null });
    try {
      await api.monitoringHealth();
      const [summary, devices, alerts, metrics, topology] = await Promise.all([
        api.monitoringSummary(), api.listDevices(), api.alerts({ limit: 200 }), api.metrics({ limit: 200 }), api.topology(),
      ]);
      const next = publish({ mode: 'api', connected: true, loading: false, error: null, summary,
        devices: devices?.items || devices || [], alerts: alerts?.items || [], metrics: metrics?.items || [], topology });
      try { window.localStorage.setItem(stateKey, JSON.stringify(next)); } catch (_) {}
      loadMikroTikServers().catch(() => {});
      return next;
    } catch (error) {
      publish({ mode: 'api', connected: false, loading: false, error: error.message || 'API unavailable' });
      throw error;
    }
  }
  function restore() {
    try {
      const saved = JSON.parse(window.localStorage.getItem(stateKey) || 'null');
      if (saved && saved.mode === 'api') publish({ ...saved, loading: false });
    } catch (_) {}
  }
  window.ISPApp.apiStore = { sync, restore, publish, loadMikroTikServers };
  restore();
  window.addEventListener('load', () => { sync().catch(() => {}); }, { once: true });
})();
