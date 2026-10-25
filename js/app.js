window.ISPApp = window.ISPApp || {};
(function(){
  function loadStyle(href,key){if(document.querySelector(`link[data-${key}]`))return;const link=document.createElement('link');link.rel='stylesheet';link.href=href;link.dataset[key]='true';document.head.appendChild(link);}
  loadStyle('css/visual-system.css','visual-system');
  loadStyle('css/noc-enhancements.css','noc-enhancements');
  loadStyle('css/dashboard-workspace.css','dashboard-workspace');

  function toast(message){const el=document.getElementById('toast');if(!el)return;el.textContent=message;el.classList.add('show');clearTimeout(window.ISPApp._toastTimer);window.ISPApp._toastTimer=setTimeout(()=>el.classList.remove('show'),2200);}
  window.ISPApp.toast=toast;

  function load(src,key){
    if(document.querySelector(`script[data-${key}]`) || document.querySelector(`script[src$="/${src}"]`)) return null;
    const script=document.createElement('script');
    script.src=src;
    script.dataset[key]='true';
    document.body.appendChild(script);
    return script;
  }
  function loadShell(){
    load('js/state.js','state');
    load('js/router.js','router');
    load('js/api-config.js','api-config');
    load('js/api-client.js','api-client');
    load('js/api-store.js','api-store');
    load('js/api-ui-bridge.js','api-ui-bridge');
    load('js/components/sidebar.js','sidebar');
    load('js/components/topbar.js','topbar');
    load('js/components/command-palette.js','command-palette');
    load('js/components/notifications.js','notifications');
  }
  function loadModules(){
    load('js/components/network-map.js','network-map');
    load('js/components/mikrotik-dashboard.js','mikrotik-dashboard');
    load('js/components/olt-dashboard.js','olt-dashboard');
    load('js/components/onu-dashboard.js','onu-dashboard');
    load('js/components/interface-monitoring.js','interface-monitoring');
    load('js/components/alert-center.js','alert-center');
    load('js/components/analytics-reports.js','analytics-reports');
    load('js/components/navigation-architecture.js','navigation-architecture');
    load('js/components/management-ui.js','management-ui');
    load('js/components/reports-ui.js','reports-ui');
    load('js/components/frontend-finalizer.js','frontend-finalizer');
    load('js/components/noc-enhancements.js','noc-enhancements');
    load('js/components/dashboard-workspace.js','dashboard-workspace');
    requestAnimationFrame(()=>window.ISPApp.router?.apply?.());
  }
  function boot(){
    loadShell();
    loadModules();
    window.ISPApp.router?.apply?.();
    toast('Application shell loaded.');
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
})();