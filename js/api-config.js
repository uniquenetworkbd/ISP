window.ISPApp = window.ISPApp || {};

// Keep the static GitHub Pages build backend-neutral until a backend is deployed.
// Set baseUrl to the deployed FastAPI origin during deployment configuration.
window.ISPApp.api = {
  baseUrl: '',
  tokenKey: 'isp_access_token',
};
