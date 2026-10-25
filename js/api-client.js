window.ISPApp = window.ISPApp || {};

(function () {
  const config = window.ISPApp.api || {};
  const baseUrl = (config.baseUrl || '').replace(/\/$/, '');

  async function request(path, options = {}) {
    const response = await fetch(`${baseUrl}/api${path}`, {
      ...options,
      headers: { 'Content-Type': 'application/json', ...(options.headers || {}) },
    });
    if (!response.ok) throw new Error(`API request failed: ${response.status}`);
    return response.json();
  }

  window.ISPApp.apiClient = {
    listDevices: () => request('/devices/'),
    createDevice: (device) => request('/devices/', {
      method: 'POST',
      body: JSON.stringify(device),
    }),
    monitoringHealth: () => request('/monitoring/health'),
  };
})();
