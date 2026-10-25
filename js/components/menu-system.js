window.ISPApp=window.ISPApp||{};
(function(){
  const items=[['dashboard','Command Center'],['topology','Interactive Topology'],['map','Network Map'],['mikrotik','MikroTik Dashboard'],['mikrotikServers','MikroTik Connect'],['olt','OLT / PON Dashboard'],['onu','ONU Monitoring'],['interfaces','Interface Monitoring'],['alerts','Alert Center'],['analytics','Analytics'],['reports','Reports'],['devices','Devices'],['system','System'],['modules','Module Manager']];
  function boot(){const nav=document.getElementById('primaryNav');if(!nav)return;nav.innerHTML=items.map(([route,label])=>`<a class="nav-link" data-route="${route}" href="#${route}"><span>${label}</span></a>`).join('');nav.dataset.menuSystem='v2';window.ISPApp.router?.apply?.();}
  document.addEventListener('isp:app-ready',boot,{once:true});
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
})();
