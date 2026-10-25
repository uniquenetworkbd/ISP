window.ISPApp=window.ISPApp||{};
(function(){
  const groups=[
    ['Command',['dashboard']],
    ['Visualization',['topology','map']],
    ['Infrastructure Monitoring',['mikrotik','mikrotikServers','olt','oltServers','onu','interfaces']],
    ['Operations',['alerts','analytics','reports']],
    ['Management',['devices','system']],
    ['Module System',['modules']]
  ];
  const labels={dashboard:'Command Center',topology:'Interactive Topology',map:'Network Map',mikrotik:'MikroTik Dashboard',mikrotikServers:'Add / Connect MikroTik',olt:'OLT / PON Dashboard',oltServers:'Add / Connect OLT',onu:'ONU Monitoring',interfaces:'Interface Monitoring',alerts:'Alert Center',analytics:'Analytics',reports:'Reports',devices:'Devices',system:'System',modules:'Module Manager'};
  const icons={dashboard:'⌂',topology:'⌘',map:'⌖',mikrotik:'◈',mikrotikServers:'＋',olt:'◉',oltServers:'＋',onu:'◇',interfaces:'⇄',alerts:'!',analytics:'◫',reports:'▤',devices:'▣',system:'⚙',modules:'▦'};
  function render(){
    const nav=document.getElementById('primaryNav');
    if(!nav)return;
    const fragment=document.createDocumentFragment();
    groups.forEach(([group,routes])=>{
      const label=document.createElement('div');
      label.className='sidebar-section-label nav-group-label';
      label.textContent=group;
      fragment.appendChild(label);
      routes.forEach(route=>{
        const link=document.createElement('a');
        link.className='nav-item nav-link';
        link.dataset.route=route;
        link.href='#'+route;
        link.setAttribute('aria-label',labels[route]);
        link.innerHTML=`<span class="nav-icon" aria-hidden="true">${icons[route]||'•'}</span><span>${labels[route]}</span>`;
        fragment.appendChild(link);
      });
    });
    nav.replaceChildren(fragment);
    nav.dataset.menuVersion='3';
    window.ISPApp.router?.apply?.();
  }
  document.addEventListener('isp:app-ready',render);
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',render,{once:true});else render();
})();
