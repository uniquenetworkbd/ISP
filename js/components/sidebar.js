window.ISPApp = window.ISPApp || {};
(function(){
  function init(){
    const sidebar=document.getElementById('sidebar'),backdrop=document.getElementById('sidebarBackdrop'),menu=document.getElementById('menuButton'),toggle=document.getElementById('sidebarToggle');
    if(!sidebar)return;
    const originalLabel=menu?.getAttribute('aria-label')||'Open navigation';
    const firstNav=()=>sidebar.querySelector('[data-route],a[href],button:not([disabled])');
    let restoreFocus=false;
    const setOpen=(open,{restore=true,focus=true}={})=>{
      sidebar.classList.toggle('is-open',open);
      backdrop?.classList.toggle('is-visible',open);
      document.body.classList.toggle('nav-open',open);
      menu?.setAttribute('aria-expanded',String(open));
      menu?.setAttribute('aria-label',open?'Close navigation':originalLabel);
      if(menu)menu.textContent=open?'×':'☰';
      window.ISPApp.setState({sidebarOpen:open});
      if(open){restoreFocus=restore; if(focus)requestAnimationFrame(()=>firstNav()?.focus());}
      else if(restore&&restoreFocus)requestAnimationFrame(()=>menu?.focus());
    };
    const close=()=>setOpen(false);
    menu?.addEventListener('click',()=>setOpen(!sidebar.classList.contains('is-open')));
    backdrop?.addEventListener('click',close);
    document.addEventListener('keydown',event=>{if(event.key==='Escape'&&sidebar.classList.contains('is-open')){event.preventDefault();close();}});
    toggle?.addEventListener('click',()=>{const collapsed=!sidebar.classList.contains('collapsed');sidebar.classList.toggle('collapsed',collapsed);toggle.setAttribute('aria-pressed',String(collapsed));window.ISPApp.setState({sidebarCollapsed:collapsed});});
    document.querySelectorAll('[data-route]').forEach(a=>a.addEventListener('click',()=>{if(window.innerWidth<=900)close();}));
    window.addEventListener('resize',()=>{if(window.innerWidth>900&&sidebar.classList.contains('is-open'))setOpen(false,{restore:false,focus:false});});
  }
  window.addEventListener('DOMContentLoaded',init);
})();
