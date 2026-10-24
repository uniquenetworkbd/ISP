window.ISPApp=window.ISPApp||{};
(function(){
  const STORAGE='isp:noc-dashboard:v1';
  const defaults={hidden:[],order:[],filters:{zone:'All',severity:'All',status:'All'},wallboard:false,view:'Operator Default'};
  const read=()=>{try{return {...defaults,...JSON.parse(localStorage.getItem(STORAGE)||'{}')}}catch{return {...defaults}}};
  let state=read();
  const save=()=>{try{localStorage.setItem(STORAGE,JSON.stringify(state))}catch{}};
  const toast=m=>window.ISPApp.toast?.(m);
  const esc=s=>String(s).replace(/[&<>\"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','\"':'&quot;',"'":'&#39;'}[c]));
  const dashboardWidgets=()=>Array.from(document.querySelectorAll('#dashboard > .card,#dashboard > .command-kpi-grid > .card,#dashboard > .command-grid > .card')).filter(x=>!x.matches('#nocHealthTimeline'));
  function ensureToolbar(){
    const page=document.querySelector('#dashboard'); if(!page||document.getElementById('dashboardWorkspaceBar'))return;
    const bar=document.createElement('div');bar.id='dashboardWorkspaceBar';bar.className='dashboard-workspace-bar card';bar.innerHTML=`
      <div class="workspace-bar-main"><div><span class="eyebrow">WORKSPACE</span><strong id="workspaceViewName">Operator Default</strong></div><span class="workspace-state" id="workspaceState">Saved locally</span></div>
      <div class="workspace-actions"><button type="button" class="button" data-ws="customize">Customize</button><button type="button" class="button" data-ws="filters">Filters</button><button type="button" class="button" data-ws="views">Saved Views</button><button type="button" class="button primary" data-ws="wallboard">Wallboard</button></div>
      <div class="workspace-popover" id="workspaceCustomize" hidden><div class="workspace-popover-head"><strong>Dashboard widgets</strong><button type="button" class="icon-button" data-ws-close="customize" aria-label="Close">×</button></div><div id="workspaceWidgetList"></div><small>Drag cards on the dashboard to reorder. Visibility is saved locally.</small></div>
      <div class="workspace-popover" id="workspaceFilters" hidden><div class="workspace-popover-head"><strong>Advanced filters</strong><button type="button" class="icon-button" data-ws-close="filters" aria-label="Close">×</button></div><div class="workspace-filter-grid"><label>Zone<select data-filter-key="zone"><option>All</option><option>North</option><option>Central</option><option>South</option></select></label><label>Severity<select data-filter-key="severity"><option>All</option><option>Critical</option><option>Warning</option><option>Info</option></select></label><label>Status<select data-filter-key="status"><option>All</option><option>Online</option><option>Warning</option><option>Offline</option></select></label></div><div class="workspace-filter-actions"><button type="button" class="button" data-ws="clear-filters">Clear</button><button type="button" class="button primary" data-ws-close="filters">Apply</button></div></div>
      <div class="workspace-popover" id="workspaceViews" hidden><div class="workspace-popover-head"><strong>Saved Views</strong><button type="button" class="icon-button" data-ws-close="views" aria-label="Close">×</button></div><div class="workspace-save-row"><input id="workspaceViewInput" placeholder="View name" maxlength="32"><button type="button" class="button primary" data-ws="save-view">Save</button></div><div id="workspaceViewList"></div></div>`;
    page.insertBefore(bar,page.firstElementChild);
  }
  function widgetKey(el,i){return el.dataset.workspaceId||`widget-${i}`}
  function labelFor(el){return el.querySelector('.eyebrow')?.textContent?.trim()||el.querySelector('h3')?.textContent?.trim()||'Widget'}
  function applyOrder(){
    const page=document.querySelector('#dashboard'); if(!page)return;
    const all=dashboardWidgets(); if(state.order.length){const map=new Map(all.map((e,i)=>[widgetKey(e,i),e]));state.order.forEach(k=>{const e=map.get(k);if(e)page.appendChild(e);map.delete(k)});map.forEach(e=>page.appendChild(e))}
    dashboardWidgets().forEach((e,i)=>{e.dataset.workspaceId=widgetKey(e,i);e.draggable=true;e.classList.toggle('workspace-hidden',state.hidden.includes(widgetKey(e,i)))});
  }
  function renderWidgetList(){const box=document.getElementById('workspaceWidgetList');if(!box)return;const all=dashboardWidgets();box.innerHTML=all.map((e,i)=>{const k=widgetKey(e,i);return `<label class="workspace-check"><input type="checkbox" data-widget-toggle="${esc(k)}" ${state.hidden.includes(k)?'':'checked'}><span>${esc(labelFor(e))}</span></label>`}).join('')}
  function renderViews(){const box=document.getElementById('workspaceViewList');if(!box)return;let views={};try{views=JSON.parse(localStorage.getItem('isp:noc:saved-views:v1')||'{}')}catch{};const names=Object.keys(views);box.innerHTML=names.length?names.map(n=>`<div class="saved-view-row"><button type="button" class="link-button" data-load-view="${esc(n)}">${esc(n)}</button><button type="button" class="icon-button" data-delete-view="${esc(n)}" aria-label="Delete ${esc(n)}">×</button></div>`).join(''):'<div class="workspace-empty">No saved views yet.</div>'}
  function applyFilters(){
    const f=state.filters;
    document.querySelectorAll('#dashboard .event-row').forEach(row=>{const text=row.textContent.toLowerCase();let ok=true;if(f.zone!=='All')ok=ok&&text.includes(f.zone.toLowerCase());if(f.severity!=='All')ok=ok&&text.includes(f.severity.toLowerCase());row.hidden=!ok});
    document.querySelectorAll('#dashboard .status-tile').forEach(tile=>{tile.hidden=f.status!=='All'&&!tile.textContent.toLowerCase().includes(f.status.toLowerCase())});
    const indicator=document.getElementById('workspaceState');if(indicator)indicator.textContent=Object.values(f).some(v=>v!=='All')?'Filters active · saved locally':'Saved locally';
  }
  function togglePanel(id){['workspaceCustomize','workspaceFilters','workspaceViews'].forEach(x=>{const el=document.getElementById(x);if(el)el.hidden=x!==id})}
  function setWallboard(on){state.wallboard=!!on;document.body.classList.toggle('noc-wallboard',state.wallboard);const b=document.querySelector('[data-ws="wallboard"]');if(b)b.textContent=state.wallboard?'Exit Wallboard':'Wallboard';save();toast(state.wallboard?'NOC Wallboard mode enabled':'NOC Wallboard mode disabled')}
  function saveView(name){name=name.trim();if(!name)return;let views={};try{views=JSON.parse(localStorage.getItem('isp:noc:saved-views:v1')||'{}')}catch{};views[name]={version:1,hidden:[...state.hidden],order:[...state.order],filters:{...state.filters},wallboard:false,savedAt:new Date().toISOString()};localStorage.setItem('isp:noc:saved-views:v1',JSON.stringify(views));state.view=name;save();renderViews();document.getElementById('workspaceViewInput').value='';document.getElementById('workspaceViewName').textContent=name;toast(`Saved view: ${name}`)}
  function loadView(name){let views={};try{views=JSON.parse(localStorage.getItem('isp:noc:saved-views:v1')||'{}')}catch{};const v=views[name];if(!v)return;state={...state,...v,filters:{...defaults.filters,...(v.filters||{})},wallboard:false};applyOrder();applyFilters();renderWidgetList();document.getElementById('workspaceViewName').textContent=name;save();togglePanel('workspaceViews');toast(`Loaded view: ${name}`)}
  function bind(){
    document.addEventListener('click',e=>{
      const action=e.target.closest('[data-ws]');if(action){const a=action.dataset.ws;if(a==='customize'){renderWidgetList();togglePanel('workspaceCustomize')}else if(a==='filters'){togglePanel('workspaceFilters')}else if(a==='views'){renderViews();togglePanel('workspaceViews')}else if(a==='wallboard')setWallboard(!state.wallboard);else if(a==='clear-filters'){state.filters={...defaults.filters};document.querySelectorAll('[data-filter-key]').forEach(x=>x.value='All');applyFilters();save()}else if(a==='save-view')saveView(document.getElementById('workspaceViewInput')?.value||'');return}
      const close=e.target.closest('[data-ws-close]');if(close){togglePanel('');return}
      const load=e.target.closest('[data-load-view]');if(load){loadView(load.dataset.loadView);return}
      const del=e.target.closest('[data-delete-view]');if(del){let views={};try{views=JSON.parse(localStorage.getItem('isp:noc:saved-views:v1')||'{}')}catch{};delete views[del.dataset.deleteView];localStorage.setItem('isp:noc:saved-views:v1',JSON.stringify(views));renderViews();toast('Saved view deleted');return}
      const toggle=e.target.closest('[data-widget-toggle]');if(toggle){const k=toggle.dataset.widgetToggle;state.hidden=toggle.checked?state.hidden.filter(x=>x!==k):Array.from(new Set([...state.hidden,k]));applyOrder();save();return}
    });
    document.addEventListener('change',e=>{const f=e.target.closest('[data-filter-key]');if(!f)return;state.filters[f.dataset.filterKey]=f.value;applyFilters();save()});
    document.addEventListener('dragstart',e=>{const card=e.target.closest('#dashboard > .card,#dashboard > .command-kpi-grid > .card,#dashboard > .command-grid > .card');if(!card)return;e.dataTransfer.setData('text/plain',widgetKey(card,0));card.classList.add('workspace-dragging')});
    document.addEventListener('dragend',e=>e.target.closest('.workspace-dragging')?.classList.remove('workspace-dragging'));
    document.addEventListener('dragover',e=>{const target=e.target.closest('#dashboard > .card,#dashboard > .command-kpi-grid > .card,#dashboard > .command-grid > .card');const drag=document.querySelector('.workspace-dragging');if(!target||!drag||target===drag)return;e.preventDefault();const r=target.getBoundingClientRect();target.parentNode.insertBefore(drag,e.clientY<r.top+r.height/2?target:target.nextSibling);state.order=dashboardWidgets().map((x,i)=>widgetKey(x,i));save()});
  }
  function init(){ensureToolbar();applyOrder();applyFilters();if(state.wallboard)setWallboard(true);document.getElementById('workspaceViewName').textContent=state.view||'Operator Default';bind();window.ISPApp.dashboardWorkspaceReady=true;window.dispatchEvent(new CustomEvent('isp:dashboard-workspace-ready'))}
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();
})();
