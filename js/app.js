window.ISPApp = window.ISPApp || {};
(function(){
  function loadStyle(href,key){if(document.querySelector(`link[data-${key}]`))return;const link=document.createElement('link');link.rel='stylesheet';link.href=href;link.dataset[key]='true';document.head.appendChild(link);}
  loadStyle('css/visual-system.css','visual-system');
  loadStyle('css/noc-enhancements.css','noc-enhancements');
  loadStyle('css/dashboard-workspace.css','dashboard-workspace');

  function toast(message){const el=document.getElementById('toast');if(!el)return;el.textContent=message;el.classList.add('show');clearTimeout(window.ISPApp._toastTimer);window.ISPApp._toastTimer=setTimeout(()=>el.classList.remove('show'),2200);}
  window.ISPApp.toast=toast;
  function load(src,key){if(document.querySelector(`script[data-${key}]`))return;const script=document.createElement('script');script.src=src;script.dataset[key]='true';document.body.appendChild(script);}
  function loadNetworkMap(){load('js/components/network-map.js','network-map');}
  function loadMikrotik(){load('js/components/mikrotik-dashboard.js','mikrotik-dashboard');}
  function loadOlt(){load('js/components/olt-dashboard.js','olt-dashboard');}
  function loadOnu(){load('js/components/onu-dashboard.js','onu-dashboard');}
  function loadInterfaces(){load('js/components/interface-monitoring.js','interface-monitoring');}
  function loadAlerts(){load('js/components/alert-center.js','alert-center');}
  function loadAnalytics(){load('js/components/analytics-reports.js','analytics-reports');}
  function loadNavigationArchitecture(){load('js/components/navigation-architecture.js','navigation-architecture');}
  function loadManagement(){load('js/components/management-ui.js','management-ui');}
  function loadReports(){load('js/components/reports-ui.js','reports-ui');}
  function loadFinalizer(){load('js/components/frontend-finalizer.js','frontend-finalizer');}
  function loadNocEnhancements(){load('js/components/noc-enhancements.js','noc-enhancements');}
  function loadDashboardWorkspace(){load('js/components/dashboard-workspace.js','dashboard-workspace');}
  window.addEventListener('DOMContentLoaded',()=>{loadNetworkMap();loadMikrotik();loadOlt();loadOnu();loadInterfaces();loadAlerts();loadAnalytics();loadNavigationArchitecture();loadManagement();loadReports();loadFinalizer();loadNocEnhancements();loadDashboardWorkspace();toast('Application shell loaded.');});
})();
