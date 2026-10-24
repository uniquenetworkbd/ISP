window.ISPApp = window.ISPApp || {};
(function(){
  function toast(message){const el=document.getElementById('toast');if(!el)return;el.textContent=message;el.classList.add('show');clearTimeout(window.ISPApp._toastTimer);window.ISPApp._toastTimer=setTimeout(()=>el.classList.remove('show'),2200);}
  window.ISPApp.toast=toast;
  function loadNetworkMap(){if(document.querySelector('script[data-network-map]'))return;const script=document.createElement('script');script.src='js/components/network-map.js';script.dataset.networkMap='true';document.body.appendChild(script);}
  window.addEventListener('DOMContentLoaded',()=>{loadNetworkMap();toast('Application shell loaded.');});
})();
