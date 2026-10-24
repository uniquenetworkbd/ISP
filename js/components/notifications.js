window.ISPApp = window.ISPApp || {};
(function(){
  function init(){
    const btn=document.getElementById('notificationButton'),pop=document.getElementById('notificationPopover');
    if(!btn||!pop||btn.dataset.bound==='true')return;
    btn.dataset.bound='true';
    const close=()=>{pop.style.display='none';btn.setAttribute('aria-expanded','false');};
    btn.addEventListener('click',e=>{e.stopPropagation();const open=pop.style.display!=='block';pop.style.display=open?'block':'none';btn.setAttribute('aria-expanded',String(open));});
    document.addEventListener('click',e=>{if(!e.target.closest('#notificationPopover')&&!e.target.closest('#notificationButton'))close();});
    document.querySelector('[data-action="mark-read"]')?.addEventListener('click',()=>{document.querySelector('.notification-dot')?.remove();window.ISPApp.setState?.({notificationsUnread:0});close();window.ISPApp.toast?.('Notifications marked as read.');});
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();
})();
