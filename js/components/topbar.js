window.ISPApp = window.ISPApp || {};
(function(){
  function init(){
    const userBtn=document.getElementById('userButton'),userPop=document.getElementById('userPopover');
    if(!userBtn||!userPop||userBtn.dataset.bound==='true')return;
    userBtn.dataset.bound='true';
    userBtn.addEventListener('click',e=>{e.stopPropagation();const open=userPop.style.display!=='grid';userPop.style.display=open?'grid':'none';userBtn.setAttribute('aria-expanded',String(open));});
    document.addEventListener('click',e=>{if(!e.target.closest('#userMenu')){userPop.style.display='none';userBtn.setAttribute('aria-expanded','false');}});
    document.querySelectorAll('[data-action]').forEach(b=>{if(b.dataset.bound==='true')return;b.dataset.bound='true';b.addEventListener('click',()=>{if(window.ISPApp.toast)window.ISPApp.toast(`${b.dataset.action} is ready for the next UI module.`);});});
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();
})();
