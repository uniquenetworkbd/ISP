window.ISPApp=window.ISPApp||{};
(function(){
  const groups=[
    {key:'command',label:'Command',routes:['dashboard']},
    {key:'visualization',label:'Visualization',routes:['topology','map']},
    {key:'infrastructure',label:'Infrastructure Monitoring',routes:['mikrotik','mikrotikServers','olt','onu','interfaces']},
    {key:'operations',label:'Operations',routes:['alerts','analytics','reports']},
    {key:'management',label:'Management',routes:['devices','system']},
    {key:'system',label:'Module System',routes:['modules']}
  ];
  const meta={
    dashboard:['⌂','Command Center'],topology:['⌘','Topology'],map:['⌖','Network Map'],
    mikrotik:['◈','MikroTik Dashboard'],mikrotikServers:['◈','MikroTik Servers'],olt:['◉','OLT / PON Dashboard'],
    onu:['◌','ONU Monitoring'],interfaces:['⇄','Interface Monitoring'],alerts:['!','Alert Center'],analytics:['◫','Analytics'],
    reports:['▤','Reports'],devices:['▣','Devices'],system:['⚙','System'],modules:['◫','Module Manager']
  };
  const expected=groups.flatMap(g=>g.routes);
  function ensureLink(route){
    const nav=document.getElementById('primaryNav');if(!nav)return null;
    let link=nav.querySelector(`[data-route="${CSS.escape(route)}"]`);
    if(link)return link;
    link=document.createElement('a');
    link.className='nav-item';
    link.href='#'+route;
    link.dataset.route=route;
    link.dataset.navGenerated='true';
    const [icon,title]=meta[route]||['＋',route];
    link.innerHTML='<span class="nav-icon"></span><span></span>';
    link.firstElementChild.textContent=icon;
    link.lastElementChild.textContent=title;
    nav.appendChild(link);
    return link;
  }
  function sync(){
    const nav=document.getElementById('primaryNav');if(!nav)return;
    expected.forEach(ensureLink);
    const byRoute=new Map([...nav.querySelectorAll('[data-route]')].map(a=>[a.dataset.route,a]));
    const frag=document.createDocumentFragment();
    groups.forEach(group=>{
      const label=document.createElement('div');
      label.className='nav-group-label';
      label.dataset.navGroup=group.key;
      label.textContent=group.label;
      frag.appendChild(label);
      group.routes.forEach(route=>{
        const link=byRoute.get(route)||ensureLink(route);
        if(link)frag.appendChild(link);
      });
    });
    nav.replaceChildren(frag);
    nav.dataset.architectureReady='true';
    nav.setAttribute('aria-label','Primary navigation');
    const sidebar=document.getElementById('sidebar');
    sidebar?.querySelectorAll('.sidebar-section-label').forEach(x=>x.hidden=true);
    sidebar?.querySelectorAll('.sidebar > .nav:not(#primaryNav)').forEach(x=>x.hidden=true);
    const footer=sidebar?.querySelector('.sidebar-footer');
    if(footer)footer.querySelector('span:last-child')?.replaceChildren(document.createTextNode(`Frontend build ${window.ISPApp.buildVersion||'unknown'} • Modular page architecture`));
    window.ISPApp.router?.apply?.();
  }
  function init(){
    const nav=document.getElementById('primaryNav');if(!nav)return;
    const observer=new MutationObserver(sync);observer.observe(nav,{childList:true});sync();
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();
})();
