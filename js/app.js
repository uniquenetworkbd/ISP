window.ISPApp = window.ISPApp || {};
(function(){
  function toast(message){const el=document.getElementById('toast');if(!el)return;el.textContent=message;el.classList.add('show');clearTimeout(window.ISPApp._toastTimer);window.ISPApp._toastTimer=setTimeout(()=>el.classList.remove('show'),2200);}
  window.ISPApp.toast=toast;
  window.addEventListener('DOMContentLoaded',()=>{toast('Application shell loaded.');});
})();
