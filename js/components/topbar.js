window.ISPApp = window.ISPApp || {};
(function(){
  function init(){const userBtn=document.getElementById('userButton'),userPop=document.getElementById('userPopover'); if(!userBtn)return;
    userBtn.addEventListener('click',e=>{e.stopPropagation();const open=userPop.hidden!==false && userPop.style.display!=='grid';userPop.style.display=open?'grid':'none';userBtn.setAttribute('aria-expanded',String(open));});
    document.addEventListener('click',e=>{if(!e.target.closest('#userMenu')){userPop.style.display='none';userBtn.setAttribute('aria-expanded','false');}});
    document.querySelectorAll('[data-action]').forEach(b=>b.addEventListener('click',()=>{if(window.ISPApp.toast)window.ISPApp.toast(`${b.dataset.action} is ready for the next UI module.`);}));
  }
  window.addEventListener('DOMContentLoaded',init);
})();
