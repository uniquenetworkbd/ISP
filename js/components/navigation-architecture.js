window.ISPApp=window.ISPApp||{};
(function(){
  const groups=[
    {key:'command',label:'Command',routes:['dashboard']},
    {key:'visualization',label:'Visualization',routes:['topology','map']},
    {key:'infrastructure',label:'Infrastructure Monitoring',routes:['mikrotik','olt','onu','interfaces']},
    {key:'operations',label:'Operations',routes:['alerts','analytics','reports']},
    {key:'management',label:'Management',routes:['devices','system']}
  ];
  const order=groups.flatMap(g=>g.routes);
  function sync(){
    const nav=document.getElementById('primaryNav');
    if(!nav||nav.dataset.architectureReady==='true')return;
    const links=[...document.querySelectorAll('.sidebar [data-route]')];
    if(!links.length)return;
    const byRoute=new Map(links.map(a=>[a.dataset.route,a]));
    const frag=document.createDocumentFragment();
    groups.forEach(group=>{
      const label=document.createElement('div');
      label.className='nav-group-label';
      label.dataset.navGroup=group.key;
      label.textContent=group.label;
      frag.appendChild(label);
      group.routes.forEach(route=>{const link=byRoute.get(route);if(link)frag.appendChild(link)});
    });
    nav.replaceChildren(frag);
    nav.dataset.architectureReady='true';
    nav.setAttribute('aria-label','Primary navigation');
    const sidebar=document.getElementById('sidebar');
    sidebar?.querySelectorAll('.sidebar-section-label').forEach(x=>x.hidden=true);
    sidebar?.querySelectorAll('.sidebar > .nav:not(#primaryNav)').forEach(x=>x.hidden=true);
    const footer=sidebar?.querySelector('.sidebar-footer');
    if(footer){footer.querySelector('span:last-child')?.replaceChildren(document.createTextNode('Frontend shell • Page architecture v1.0'));}
  }
  function init(){
    const nav=document.getElementById('primaryNav');
    if(!nav)return;
    const observer=new MutationObserver(()=>{if(nav.dataset.architectureReady!=='true')sync()});
    observer.observe(nav,{childList:true});
    sync();
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();
})();
