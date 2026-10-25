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
  let observer=null;
  let syncing=false;
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
    if(syncing)return;
    const nav=document.getElementById('primaryNav');if(!nav)return;
    syncing=true;
    try{
      expected.forEach(ensureLink);
      const byRoute=new Map([...nav.querySelectorAll('[data-route]')].map(a=>[a.dataset.route,a]));
      const desired=[];
      groups.forEach(group=>{
        const label=document.createElement('div');
        label.className='nav-group-label';
        label.dataset.navGroup=group.key;
        label.textContent=group.label;
        desired.push(label);
        group.routes.forEach(route=>{const link=byRoute.get(route)||ensureLink(route);if(link)desired.push(link)});
      });
      const current=Array.from(nav.children);
      const unchanged=current.length===desired.length&&current.every((node,i)=>node===desired[i]&&node.nodeType===desired[i].nodeType&&node.dataset?.route===desired[i].dataset?.route&&node.dataset?.navGroup===desired[i].dataset?.navGroup);
      if(!unchanged){
        observer?.disconnect();
        nav.replaceChildren(...desired);
        observer?.observe(nav,{childList:true});
      }
      nav.dataset.architectureReady='true';
      nav.setAttribute('aria-label','Primary navigation');
      const sidebar=document.getElementById('sidebar');
      sidebar?.querySelectorAll('.sidebar-section-label').forEach(x=>x.hidden=true);
      sidebar?.querySelectorAll('.sidebar > .nav:not(#primaryNav)').forEach(x=>x.hidden=true);
      const footer=sidebar?.querySelector('.sidebar-footer');
      if(footer)footer.querySelector('span:last-child')?.replaceChildren(document.createTextNode(`Frontend build ${window.ISPApp.buildVersion||'unknown'} • Modular page architecture`));
      if(!unchanged)window.ISPApp.router?.apply?.();
    }finally{syncing=false}
  }
  function init(){
    const nav=document.getElementById('primaryNav');if(!nav)return;
    observer=new MutationObserver(()=>sync());
    observer.observe(nav,{childList:true});
    sync();
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();
})();