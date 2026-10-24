window.ISPApp = window.ISPApp || {};
(function(){
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
  window.addEventListener('DOMContentLoaded',()=>{loadNetworkMap();loadMikrotik();loadOlt();loadOnu();loadInterfaces();loadAlerts();loadAnalytics();toast('Application shell loaded.');});
})();