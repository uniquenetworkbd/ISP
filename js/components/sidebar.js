window.ISPApp = window.ISPApp || {};
(function(){
  function init(){const sidebar=document.getElementById('sidebar'),backdrop=document.getElementById('sidebarBackdrop'),menu=document.getElementById('menuButton'),toggle=document.getElementById('sidebarToggle'); if(!sidebar)return;
    const close=()=>{sidebar.classList.remove('is-open');backdrop.classList.remove('is-visible');menu?.setAttribute('aria-expanded','false');window.ISPApp.setState({sidebarOpen:false});};
    menu?.addEventListener('click',()=>{const open=!sidebar.classList.contains('is-open');sidebar.classList.toggle('is-open',open);backdrop.classList.toggle('is-visible',open);menu.setAttribute('aria-expanded',String(open));window.ISPApp.setState({sidebarOpen:open});});
    backdrop?.addEventListener('click',close); toggle?.addEventListener('click',()=>{const collapsed=!sidebar.classList.contains('collapsed');sidebar.classList.toggle('collapsed',collapsed);toggle.setAttribute('aria-pressed',String(collapsed));window.ISPApp.setState({sidebarCollapsed:collapsed});});
    document.querySelectorAll('[data-route]').forEach(a=>a.addEventListener('click',()=>{if(window.innerWidth<=900)close();}));
  }
  window.addEventListener('DOMContentLoaded',init);
})();
