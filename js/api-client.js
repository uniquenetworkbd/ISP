window.ISPApp = window.ISPApp || {};

(function () {
  const config = window.ISPApp.api || {};
  const baseUrl = (config.baseUrl || '').replace(/\/$/, '');
  const tokenKey = config.tokenKey || 'isp_access_token';
  const defaultTimeout = Number(config.timeoutMs) > 0 ? Number(config.timeoutMs) : 10000;

  function authHeaders() {
    const token = window.localStorage.getItem(tokenKey);
    return token ? { Authorization: `Bearer ${token}` } : {};
  }

  async function request(path, options = {}) {
    const headers = {
      Accept: 'application/json',
      ...(options.body ? { 'Content-Type': 'application/json' } : {}),
      ...authHeaders(),
      ...(options.headers || {}),
    };
    const controller = new AbortController();
    const timeoutMs = Number(options.timeoutMs) > 0 ? Number(options.timeoutMs) : defaultTimeout;
    const timeoutId = window.setTimeout(() => controller.abort(), timeoutMs);
    try {
      const response = await fetch(`${baseUrl}/api${path}`, { ...options, headers, signal: controller.signal });
      let payload = null;
      try { payload = await response.json(); } catch (_) { payload = null; }
      if (!response.ok) {
        const message = payload?.detail || `API request failed: ${response.status}`;
        const error = new Error(message);
        error.status = response.status;
        error.payload = payload;
        throw error;
      }
      return payload;
    } catch (error) {
      if (error?.name === 'AbortError') {
        const timeoutError = new Error(`API request timed out after ${timeoutMs}ms`);
        timeoutError.code = 'API_TIMEOUT';
        timeoutError.path = path;
        throw timeoutError;
      }
      throw error;
    } finally {
      window.clearTimeout(timeoutId);
    }
  }

  const apiClient = {
    isConfigured: () => Boolean(baseUrl),
    getBaseUrl: () => baseUrl,
    request,
    systemStatus: () => request('/system/status'),
    login: async (username, password) => {
      const result = await request('/auth/login', { method: 'POST', body: JSON.stringify({ username, password }) });
      if (result?.access_token) window.localStorage.setItem(tokenKey, result.access_token);
      return result;
    },
    logout: () => window.localStorage.removeItem(tokenKey),
    me: () => request('/auth/me'),
    roles: () => request('/auth/roles'),
    listDevices: () => request('/devices/'),
    getDevice: (id) => request(`/devices/${encodeURIComponent(id)}`),
    createDevice: (device) => request('/devices/', { method: 'POST', body: JSON.stringify(device) }),
    monitoringHealth: () => request('/monitoring/health'),
    monitoringSummary: () => request('/monitoring/summary'),
    metrics: (params = {}) => { const query = new URLSearchParams(params).toString(); return request(`/monitoring/metrics${query ? `?${query}` : ''}`); },
    alerts: (params = {}) => { const query = new URLSearchParams(params).toString(); return request(`/monitoring/alerts${query ? `?${query}` : ''}`); },
    acknowledgeAlert: (id) => request(`/monitoring/alerts/${encodeURIComponent(id)}/acknowledge`, { method: 'POST' }),
    resolveAlert: (id) => request(`/monitoring/alerts/${encodeURIComponent(id)}/resolve`, { method: 'POST' }),
    zones: () => request('/network/zones'),
    pops: (zoneId) => request(`/network/pops${zoneId == null ? '' : `?zone_id=${encodeURIComponent(zoneId)}`}`),
    topology: () => request('/network/topology'),
    databaseHealth: () => request('/database/health'),
    oltServers: () => request('/olt/servers'),
    oltTestConnection: (payload) => request('/olt/test-connection', { method: 'POST', body: JSON.stringify(payload) }),
    oltCreateServer: (payload) => request('/olt/servers', { method: 'POST', body: JSON.stringify(payload) }),
    oltProbe: (id) => request(`/olt/servers/${encodeURIComponent(id)}/probe`, { method: 'POST' }),
    oltDeleteServer: (id) => request(`/olt/servers/${encodeURIComponent(id)}`, { method: 'DELETE' }),
    mikrotikServers: () => request('/mikrotik/servers'),
    mikrotikTestConnection: (payload) => request('/mikrotik/test-connection', { method: 'POST', body: JSON.stringify(payload) }),
    mikrotikCreateServer: (payload) => request('/mikrotik/servers', { method: 'POST', body: JSON.stringify(payload) }),
    mikrotikDeleteServer: (id) => request(`/mikrotik/servers/${encodeURIComponent(id)}`, { method: 'DELETE' }),
    mikrotikScan: (id) => request(`/mikrotik/servers/${encodeURIComponent(id)}/scan`, { method: 'POST' }),
    mikrotikUsers: (id, search = '') => request(`/mikrotik/servers/${encodeURIComponent(id)}/users${search ? `?search=${encodeURIComponent(search)}` : ''}`),
    mikrotikLive: (id) => request(`/mikrotik/servers/${encodeURIComponent(id)}/live`),
    mikrotikTestSavedServer: (id) => request(`/mikrotik/servers/${encodeURIComponent(id)}/test`, { method: 'POST' }),
    mikrotikConnectionTests: (id, limit = 20) => request(`/mikrotik/servers/${encodeURIComponent(id)}/connection-tests?limit=${encodeURIComponent(limit)}`),
  };

  window.ISPApp.apiClient = apiClient;
})();
