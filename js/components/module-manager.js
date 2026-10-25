window.ISPApp=window.ISPApp||{};
(function(){
  const coreModules=[
    {route:'dashboard',title:'Command Center',group:'Command',selector:'#dashboard',state:'UI ready',data:'demo / API-ready'},
    {route:'topology',title:'Interactive Topology',group:'Visualization',selector:'#topologyView',state:'UI ready',data:'demo / API-ready'},
    {route:'map',title:'Network Map',group:'Visualization',selector:'[data-view="map"]',state:'UI ready',data:'demo / API-ready'},
    {route:'mikrotik',title:'MikroTik Monitoring',group:'Infrastructure Monitoring',selector:'[data-view="mikrotik"]',state:'UI ready',data:'API contract'},
    {route:'mikrotikServers',title:'MikroTik Servers',group:'Infrastructure Monitoring',selector:'[data-view="mikrotikServers"]',state:'UI ready',data:'backend required'},
    {route:'olt',title:'OLT / PON',group:'Infrastructure Monitoring',selector:'[data-view="olt"]',state:'UI ready',data:'demo / API-ready'},
    {route:'onu',title:'ONU Monitoring',group:'Infrastructure Monitoring',selector:'[data-view="onu"]',state:'UI ready',data:'demo / API-ready'},
    {route:'interfaces',title:'Interface Monitoring',group:'Infrastructure Monitoring',selector:'[data-view="interfaces"]',state:'UI ready',data:'demo / API-ready'},
    {route:'alerts',title:'Alert Center',group:'Operations',selector:'[data-view="alerts"]',state:'UI ready',data:'API contract'},
    {route:'analytics',title:'Analytics',group:'Operations',selector:'[data-view="analytics"]',state:'UI ready',data:'API contract'},
    {route:'reports',title:'Reports',group:'Operations',selector:'[data-view="reports"]',state:'UI ready',data:'service future'},
    {route:'devices',title:'Devices',group:'Management',selector:'[data-view="devices"]',state:'UI ready',data:'API contract'},
    {route:'system',title:'System',group:'Management',selector:'[data-view="system"]',state:'UI ready',data:'auth/API contract'}
  ];
  const key='isp_module_registry_v1';
  function custom(){try{return JSON.parse(localStorage.getItem(key)||'[]')}catch{return[]}}
  function all(){return coreModules.concat(custom())}
  function routeExists(route){return !!document.querySelector(`[data-route="${CSS.escape(route)}"]`)}
  function addNav(m){
    if(routeExists(m.route))return;
    const nav=document.getElementById('primaryNav'); if(!nav)return;
    const a=document.createElement('a'); a.className='nav-item'; a.href='#'+m.route; a.dataset.route=m.route;
    a.innerHTML='<span class="nav-icon">＋</span><span></span>'; a.lastElementChild.textContent=m.title; nav.appendChild(a);
  }
  function createPage(m){
    if(document.querySelector(`[data-view="${CSS.escape(m.route)}"]`))return;
    const main=document.querySelector('main.main'); if(!main)return;
    const section=document.createElement('section'); section.className='content module-page'; section.id='module-'+m.route; section.dataset.view=m.route; section.hidden=true;
    section.innerHTML=`<div class="hero-row"><div><p class="eyebrow">MODULE / ${m.group.toUpperCase()}</p><h2></h2><p class="muted"></p></div><span class="badge success">Registered</span></div><div class="module-grid"><article class="card panel"><div class="panel-head"><div><span class="eyebrow">PAGE MODULE</span><h3>Module information</h3></div></div><dl class="module-facts"><div><dt>Route</dt><dd></dd></div><div><dt>Group</dt><dd></dd></div><div><dt>UI state</dt><dd></dd></div><div><dt>Data boundary</dt><dd></dd></div></dl></article><article class="card panel"><div class="panel-head"><div><span class="eyebrow">MODULE SLOT</span><h3>Ready for feature content</h3></div></div><p class="muted">This registered page is an isolated module surface. Replace this slot with a dedicated component without changing the application shell or navigation architecture.</p><div class="module-actions"><button type="button" class="button" data-module-open>Open module</button><button type="button" class="button ghost" data-module-refresh>Refresh registry</button></div></article></div>`;
    section.querySelector('h2').textContent=m.title; section.querySelector('.muted').textContent=m.description||'Registered frontend module surface.';
    const vals=[m.route,m.group,m.state,m.data]; section.querySelectorAll('.module-facts dd').forEach((x,i)=>x.textContent=vals[i]);
    main.appendChild(section);
  }
  function register(m){
    if(!m.route||!m.title)return false;
    if(!/^[a-z][a-z0-9_-]{1,40}$/.test(m.route))throw new Error('Route must use lowercase letters, numbers, _ or -.');
    const list=custom(); if(list.some(x=>x.route===m.route)||coreModules.some(x=>x.route===m.route))throw new Error('Route already exists.');
    list.push({route:m.route,title:m.title,group:m.group||'Custom',description:m.description||'',state:'Registered',data:'local module registry'}); localStorage.setItem(key,JSON.stringify(list)); return list.at(-1);
  }
  function renderManager(){
    const page=document.querySelector('[data-view="modules"]'); if(!page)return;
    const grid=page.querySelector('[data-module-grid]'); if(!grid)return;
    grid.replaceChildren();
    const modules=all();
    page.querySelector('[data-module-count]').textContent=modules.length;
    modules.forEach(m=>{
      const card=document.createElement('article'); card.className='card panel module-card';
      const exists=!!document.querySelector(`[data-view="${CSS.escape(m.route)}"]`);
      card.innerHTML=`<div class="module-card-head"><div><span class="eyebrow"></span><h3></h3></div><span class="badge success">${exists?'Mounted':'Registered'}</span></div><p class="muted"></p><div class="module-meta"><span>Route: <b></b></span><span>Data: <b></b></span></div><div class="module-actions"><button type="button" class="button" data-open>Open</button></div>`;
      card.querySelector('.eyebrow').textContent=m.group; card.querySelector('h3').textContent=m.title; card.querySelector('.muted').textContent=m.description||'Existing prepared frontend page module.'; card.querySelectorAll('.module-meta b')[0].textContent='#'+m.route; card.querySelectorAll('.module-meta b')[1].textContent=m.data;
      card.querySelector('[data-open]').addEventListener('click',()=>{location.hash='#'+m.route}); grid.appendChild(card);
      addNav(m); if(m.selector&&document.querySelector(m.selector)){} else if(m.route!=='modules') createPage(m);
    });
  }
  function mountManager(){
    if(document.querySelector('[data-view="modules"]'))return;
    const main=document.querySelector('main.main'); if(!main)return;
    const section=document.createElement('section'); section.className='content module-manager-page'; section.dataset.view='modules'; section.hidden=true;
    section.innerHTML=`<div class="hero-row"><div><p class="eyebrow">MODULE SYSTEM / V1</p><h2>Frontend Module Manager</h2><p class="muted">View every prepared page as an isolated module and register additional module-page surfaces without changing the application shell.</p></div><div class="badge success"><span class="status-dot"></span><span data-module-count>0</span> modules</div></div><div class="module-manager-toolbar"><button type="button" class="button" data-add-module>＋ Add Module Page</button><button type="button" class="button ghost" data-refresh-modules>Refresh</button></div><div class="module-grid" data-module-grid></div><div class="card panel module-add-panel" hidden><div class="panel-head"><div><span class="eyebrow">REGISTER MODULE</span><h3>New frontend page module</h3></div></div><form data-module-form class="module-form"><label>Title<input name="title" required maxlength="80"></label><label>Route<input name="route" required pattern="[a-z][a-z0-9_-]{1,40}" placeholder="custom-module"></label><label>Group<input name="group" value="Custom" maxlength="50"></label><label class="wide">Description<textarea name="description" rows="3" maxlength="240"></textarea></label><div class="module-actions wide"><button class="button" type="submit">Register Module</button><button class="button ghost" type="button" data-cancel-module>Cancel</button></div></form></div>`;
    main.appendChild(section);
    section.querySelector('[data-add-module]').onclick=()=>section.querySelector('.module-add-panel').hidden=false;
    section.querySelector('[data-cancel-module]').onclick=()=>section.querySelector('.module-add-panel').hidden=true;
    section.querySelector('[data-refresh-modules]').onclick=renderManager;
    section.querySelector('[data-module-form]').onsubmit=e=>{e.preventDefault();const f=new FormData(e.currentTarget);try{register(Object.fromEntries(f));e.currentTarget.reset();section.querySelector('.module-add-panel').hidden=true;renderManager();window.ISPApp.toast?.('Module registered.')}catch(err){window.ISPApp.toast?.(err.message)}};
    renderManager();
  }
  window.ISPApp.modules={core:coreModules,all,register,refresh:renderManager};
  function init(){
    mountManager();
    const observer=new MutationObserver(()=>{all().forEach(addNav)}); observer.observe(document.getElementById('primaryNav')||document.body,{childList:true,subtree:true});
    all().forEach(m=>{addNav(m); if(m.route!=='modules' && !m.selector)createPage(m)});
    addNav({route:'modules',title:'Module Manager',group:'System'});
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();
})();
