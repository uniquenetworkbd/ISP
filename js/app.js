window.ISPApp = window.ISPApp || {};
(function () {
  const BUILD_VERSION = '2026.10.25.2345';
  const loaded = new Map(); window.ISPApp.buildVersion = BUILD_VERSION;
  const version = u => u.includes('?') ? `${u}&v=${BUILD_VERSION}` : `${u}?v=${BUILD_VERSION}`;
  function loadScript(src){const key=version(src);if(loaded.has(key))return loaded.get(key);const p=new Promise((resolve,reject)=>{const s=document.createElement('script');s.src=key;s.async=true;s.onload=resolve;s.onerror=()=>reject(new Error(`Failed to load ${src}`));document.head.appendChild(s)});loaded.set(key,p);return p}
  function loadStyle(src){const key=version(src);if(document.querySelector(`link[data-isp-style="${src}"]`))return;const link=document.createElement('link');link.rel='stylesheet';link.href=key;link.dataset.ispStyle=src;document.head.appendChild(link)}
  function loadGroup(list){return Promise.allSettled(list.map(loadScript))}
  function expose(){document.documentElement.dataset.ispBuild=BUILD_VERSION;document.body?.setAttribute('data-isp-build',BUILD_VERSION);document.querySelectorAll('.sidebar-footer span:last-child').forEach(x=>x.textContent=`Frontend build ${BUILD_VERSION}`)}
  async function boot(){
    loadStyle('css/mikrotik.css');
    const critical=['js/state.js','js/router.js','js/api-config.js','js/api-client.js','js/api-store.js','js/components/sidebar.js','js/components/topbar.js'];
    await loadGroup(critical);
    window.ISPApp.router?.apply?.(); expose(); document.body?.classList.add('isp-ready');
    document.dispatchEvent(new CustomEvent('isp:app-ready',{detail:{buildVersion:BUILD_VERSION}}));
    const optional=['js/api-ui-bridge.js','js/components/command-palette.js','js/components/notifications.js','js/components/network-map.js','js/components/mikrotik-dashboard.js','js/components/mikrotik-login-page.js','js/components/menu-system-v2.js','js/components/olt-dashboard.js','js/components/onu-dashboard.js','js/components/interface-monitoring.js','js/components/alert-center.js','js/components/analytics-reports.js','js/components/management-ui.js','js/components/reports-ui.js','js/components/frontend-finalizer.js','js/components/noc-enhancements.js','js/components/dashboard-workspace.js','js/components/module-manager.js','js/components/navigation-architecture.js'];
    loadGroup(optional).then(()=>{window.ISPApp.router?.apply?.();window.ISPApp.modules?.refresh?.();document.dispatchEvent(new CustomEvent('isp:enhancements-ready'));}).catch(()=>{});
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
})();
