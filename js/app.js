window.ISPApp = window.ISPApp || {};
(function () {
  const BUILD_VERSION = '2026.10.25.1550';
  const loaded = new Map();
  window.ISPApp.buildVersion = BUILD_VERSION;

  function assetUrl(src) {
    const separator = src.includes('?') ? '&' : '?';
    return `${src}${separator}v=${encodeURIComponent(BUILD_VERSION)}`;
  }

  function loadStyle(href, key) {
    if (document.querySelector(`link[data-${key}]`)) return;
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = assetUrl(href);
    link.dataset[key] = 'true';
    document.head.appendChild(link);
  }

  function toast(message) {
    const el = document.getElementById('toast');
    if (!el) return;
    el.textContent = message;
    el.classList.add('show');
    clearTimeout(window.ISPApp._toastTimer);
    window.ISPApp._toastTimer = setTimeout(() => el.classList.remove('show'), 2600);
  }

  function loadScript(src, key) {
    const versionedSrc = assetUrl(src);
    const existing = loaded.get(versionedSrc) || document.querySelector(`script[src="${versionedSrc}"]`);
    if (existing) {
      if (existing.__ispLoadPromise) return existing.__ispLoadPromise;
      if (existing.dataset.loaded === 'true' || document.readyState !== 'loading') {
        existing.dataset.loaded = 'true';
        return Promise.resolve(existing);
      }
    }
    if (loaded.has(versionedSrc)) return loaded.get(versionedSrc);

    const promise = new Promise((resolve, reject) => {
      const script = existing || document.createElement('script');
      if (!existing) {
        script.src = versionedSrc;
        script.dataset[key] = 'true';
        document.body.appendChild(script);
      }
      script.addEventListener('load', () => {
        script.dataset.loaded = 'true';
        resolve(script);
      }, { once: true });
      script.addEventListener('error', () => reject(new Error(`Failed to load ${versionedSrc}`)), { once: true });
    });
    if (existing) existing.__ispLoadPromise = promise;
    loaded.set(versionedSrc, promise);
    return promise;
  }

  async function loadGroup(items) {
    for (const [src, key] of items) {
      try {
        await loadScript(src, key);
      } catch (error) {
        console.error('[ISP] module load failed:', src, error);
      }
    }
  }

  function exposeBuildMarker() {
    document.documentElement.dataset.ispBuild = BUILD_VERSION;
    document.body.dataset.ispBuild = BUILD_VERSION;
    const footer = document.querySelector('.sidebar-footer span:last-child');
    if (footer) footer.textContent = `Frontend build ${BUILD_VERSION}`;
  }

  async function boot() {
    exposeBuildMarker();
    ['css/visual-system.css', 'css/noc-enhancements.css', 'css/dashboard-workspace.css', 'css/mikrotik-server-manager.css', 'css/module-manager.css']
      .forEach((href, index) => loadStyle(href, `runtime-${index}`));

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
      ['js/components/module-manager.js', 'module-manager'],
      ['js/components/navigation-architecture.js', 'navigation-architecture']
    ]);

    window.ISPApp.router?.apply?.();
    window.ISPApp.modules?.refresh?.();
    exposeBuildMarker();
    window.dispatchEvent(new CustomEvent('isp:app-ready', { detail: { buildVersion: BUILD_VERSION } }));
    toast(`Application ready • build ${BUILD_VERSION}`);
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot, { once: true });
  else boot();
})();
