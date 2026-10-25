window.ISPApp = window.ISPApp || {};
(function () {
  const loaded = new Map();

  function loadStyle(href, key) {
    if (document.querySelector(`link[data-${key}]`)) return;
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = href;
    link.dataset[key] = 'true';
    document.head.appendChild(link);
  }

  function toast(message) {
    const el = document.getElementById('toast');
    if (!el) return;
    el.textContent = message;
    el.classList.add('show');
    clearTimeout(window.ISPApp._toastTimer);
    window.ISPApp._toastTimer = setTimeout(() => el.classList.remove('show'), 2200);
  }

  function loadScript(src, key) {
    const existing = loaded.get(src) || document.querySelector(`script[src$="/${src}"]`);
    if (existing) {
      if (existing.__ispLoadPromise) return existing.__ispLoadPromise;
      if (existing.dataset.loaded === 'true') return Promise.resolve(existing);
    }
    if (loaded.has(src)) return loaded.get(src);

    const promise = new Promise((resolve, reject) => {
      const script = existing || document.createElement('script');
      if (!existing) {
        script.src = src;
        script.dataset[key] = 'true';
        document.body.appendChild(script);
      }
      script.addEventListener('load', () => {
        script.dataset.loaded = 'true';
        resolve(script);
      }, { once: true });
      script.addEventListener('error', () => reject(new Error(`Failed to load ${src}`)), { once: true });
    });
    if (existing) existing.__ispLoadPromise = promise;
    loaded.set(src, promise);
    return promise;
  }

  async function loadGroup(items) {
    for (const [src, key] of items) {
      try { await loadScript(src, key); }
      catch (error) { console.error('[ISP] module load failed:', src, error); }
    }
  }

  async function boot() {
    [
      'css/visual-system.css',
      'css/noc-enhancements.css',
      'css/dashboard-workspace.css',
      'css/mikrotik-server-manager.css'
    ].forEach((href, index) => loadStyle(href, `runtime-${index}`));

    window.ISPApp.toast = toast;

    await loadGroup([
      ['js/state.js', 'state'],
      ['js/router.js', 'router'],
      ['js/api-config.js', 'api-config'],
      ['js/api-client.js', 'api-client'],
      ['js/api-store.js', 'api-store'],
      ['js/api-ui-bridge.js', 'api-ui-bridge'],
      ['js/components/sidebar.js', 'sidebar'],
      ['js/components/topbar.js', 'topbar'],
      ['js/components/command-palette.js', 'command-palette'],
      ['js/components/notifications.js', 'notifications']
    ]);

    await loadGroup([
      ['js/components/network-map.js', 'network-map'],
      ['js/components/mikrotik-dashboard.js', 'mikrotik-dashboard'],
      ['js/components/mikrotik-server-manager.js', 'mikrotik-server-manager'],
      ['js/components/olt-dashboard.js', 'olt-dashboard'],
      ['js/components/onu-dashboard.js', 'onu-dashboard'],
      ['js/components/interface-monitoring.js', 'interface-monitoring'],
      ['js/components/alert-center.js', 'alert-center'],
      ['js/components/analytics-reports.js', 'analytics-reports'],
      ['js/components/management-ui.js', 'management-ui'],
      ['js/components/reports-ui.js', 'reports-ui'],
      ['js/components/frontend-finalizer.js', 'frontend-finalizer'],
      ['js/components/noc-enhancements.js', 'noc-enhancements'],
      ['js/components/dashboard-workspace.js', 'dashboard-workspace'],
      ['js/components/navigation-architecture.js', 'navigation-architecture']
    ]);

    window.ISPApp.router?.apply?.();
    window.dispatchEvent(new CustomEvent('isp:app-ready'));
    toast('Application ready.');
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot, { once: true });
  } else {
    boot();
  }
})();
