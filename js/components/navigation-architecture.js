window.ISPApp=window.ISPApp||{};
(function(){
  const groups=[
    {key:'command',label:'Command',routes:['dashboard']},
    {key:'visualization',label:'Visualization',routes:['topology','map']},
    {key:'infrastructure',label:'Infrastructure Monitoring',routes:['mikrotik','mikrotikServers','olt','onu','interfaces']},
    {key:'operations',label:'Operations',routes:['alerts','analytics','reports']},
    {key:'management',label:'Management',routes:['devices','system']}
  ];
  const expected=groups.flatMap(g=>g.routes);
  function sync(){
    const nav=document.getElementById('primaryNav');
    if(!nav)return;
    const links=[...document.querySelectorAll('.sidebar [data-route]')];
    const byRoute=new Map(links.map(a=>[a.dataset.route,a]));
    if(!expected.every(route=>byRoute.has(route)))return;
    const frag=document.createDocumentFragment();
    groups.forEach(group=>{
      const label=document.createElement('div');
      label.className='nav-group-label';
      label.dataset.navGroup=group.key;
      label.textContent=group.label;
      frag.appendChild(label);
      group.routes.forEach(route=>frag.appendChild(byRoute.get(route)));
    });
    nav.replaceChildren(frag);
    nav.dataset.architectureReady='true';
    nav.setAttribute('aria-label','Primary navigation');
    const sidebar=document.getElementById('sidebar');
    sidebar?.querySelectorAll('.sidebar-section-label').forEach(x=>x.hidden=true);
    sidebar?.querySelectorAll('.sidebar > .nav:not(#primaryNav)').forEach(x=>x.hidden=true);
    const footer=sidebar?.querySelector('.sidebar-footer');
    if(footer)footer.querySelector('span:last-child')?.replaceChildren(document.createTextNode('Frontend shell • Page architecture v1.0'));
    window.ISPApp.router?.apply?.();
  }
  function init(){
    const nav=document.getElementById('primaryNav');
    if(!nav)return;
    const observer=new MutationObserver(sync);
    observer.observe(nav,{childList:true});
    sync();
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();
})();