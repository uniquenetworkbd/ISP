window.ISPApp=window.ISPApp||{};
(function(){
  const devices=[
    {id:'Core-01',type:'MikroTik',zone:'NOC',status:'Online',meta:'RB4011iGS+ · 10.10.0.1',route:'#mikrotik'},
    {id:'Edge-N01',type:'MikroTik',zone:'North POP',status:'Online',meta:'CCR2004 · 10.10.1.1',route:'#mikrotik'},
    {id:'Edge-C01',type:'MikroTik',zone:'Central POP',status:'Online',meta:'CCR1009 · 10.10.2.1',route:'#mikrotik'},
    {id:'Edge-S01',type:'MikroTik',zone:'South POP',status:'Warning',meta:'CCR2004 · 10.10.3.1',route:'#mikrotik'},
    {id:'OLT-N01',type:'OLT',zone:'North',status:'Online',meta:'OLT North · PON fleet',route:'#olt'},
    {id:'OLT-C01',type:'OLT',zone:'Central',status:'Online',meta:'OLT Central · PON fleet',route:'#olt'},
    {id:'OLT-S01',type:'OLT',zone:'South',status:'Warning',meta:'OLT South · optical warning',route:'#olt'},
    {id:'ONU-001',type:'ONU',zone:'North / POP-01',status:'Online',meta:'Optical endpoint',route:'#onu'},
    {id:'ONU-024',type:'ONU',zone:'Central / POP-02',status:'Online',meta:'Optical endpoint',route:'#onu'},
    {id:'ONU-118',type:'ONU',zone:'South / POP-04',status:'Online',meta:'Optical endpoint',route:'#onu'}
  ];
  const alerts=[
    {id:'ALT-1042',severity:'Critical',title:'Backup transit interface offline',source:'Edge-S01',route:'#alerts'},
    {id:'ALT-1041',severity:'Warning',title:'PON optical level marginal',source:'OLT-S01',route:'#alerts'},
    {id:'ALT-1040',severity:'Critical',title:'Optical signal below threshold',source:'ONU-118',route:'#alerts'},
    {id:'ALT-1039',severity:'Warning',title:'Uplink utilization above 90%',source:'Edge-C01',route:'#alerts'}
  ];
  const esc=s=>String(s).replace(/[&<>\"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','\"':'&quot;',"'":'&#39;'}[c]));
  function ensureLayer(){
    if(document.getElementById('nocEnhancementLayer'))return;
    const layer=document.createElement('div');layer.id='nocEnhancementLayer';layer.innerHTML=`
      <div class="noc-search-overlay" id="nocSearchOverlay" hidden>
        <div class="noc-search-dialog" role="dialog" aria-modal="true" aria-labelledby="nocSearchTitle">
          <div class="noc-search-head"><div><span class="eyebrow">GLOBAL SEARCH</span><h3 id="nocSearchTitle">Find anything in the NOC</h3></div><button type="button" class="icon-button" data-noc-close="search" aria-label="Close search">×</button></div>
          <input id="nocSearchInput" class="noc-search-input" type="search" placeholder="Device, alert, zone, route…" autocomplete="off">
          <div id="nocSearchResults" class="noc-search-results"></div>
        </div>
      </div>
      <aside class="noc-device-drawer" id="nocDeviceDrawer" aria-hidden="true" aria-labelledby="nocDrawerTitle">
        <div class="noc-drawer-head"><div><span class="eyebrow">DEVICE DETAIL</span><h3 id="nocDrawerTitle">Device</h3></div><button type="button" class="icon-button" data-noc-close="drawer" aria-label="Close device detail">×</button></div>
        <div id="nocDrawerBody"></div>
      </aside>`;
    document.body.appendChild(layer);
  }
  function openSearch(){const o=document.getElementById('nocSearchOverlay');if(!o)return;o.hidden=false;renderSearch('');setTimeout(()=>document.getElementById('nocSearchInput')?.focus(),0);}
  function closeSearch(){const o=document.getElementById('nocSearchOverlay');if(o)o.hidden=true;}
  function renderSearch(q){
    const box=document.getElementById('nocSearchResults');if(!box)return;
    const term=q.trim().toLowerCase();
    const results=[...devices.map(d=>({...d,kind:'Device'})),...alerts.map(a=>({...a,kind:'Alert',type:a.severity,meta:`${a.source} · ${a.title}`}))]
      .filter(x=>!term||Object.values(x).some(v=>String(v).toLowerCase().includes(term))).slice(0,12);
    box.innerHTML=results.length?results.map(x=>`<button type="button" class="noc-result" data-noc-result="${esc(x.id)}"><span class="noc-result-icon">${x.kind==='Alert'?'!':'◈'}</span><span><strong>${esc(x.id)} · ${esc(x.type)}</strong><small>${esc(x.meta||x.zone||'')}</small></span><span class="badge ${x.status==='Warning'||x.severity==='Warning'?'warning':x.severity==='Critical'?'danger':'success'}">${esc(x.status||x.severity)}</span></button>`).join(''):`<div class="noc-empty-state"><strong>No matching records</strong><span>Try a device name, alert ID, zone or type.</span></div>`;
  }
  function findRecord(id){return devices.find(d=>d.id===id)||alerts.find(a=>a.id===id);}
  function openDevice(id){
    const d=findRecord(id);if(!d)return;
    const drawer=document.getElementById('nocDeviceDrawer');const body=document.getElementById('nocDrawerBody');
    document.getElementById('nocDrawerTitle').textContent=d.id;
    const isAlert=d.kind==='Alert'||!!d.severity;
    body.innerHTML=isAlert?`<div class="noc-detail-status"><span class="badge danger">${esc(d.severity)}</span><strong>${esc(d.title)}</strong></div><dl class="noc-detail-list"><div><dt>Source</dt><dd>${esc(d.source)}</dd></div><div><dt>Investigation</dt><dd>Alert Center</dd></div><div><dt>Next action</dt><dd>Review source device and affected path.</dd></div></dl><a class="button primary noc-route" href="${d.route}">Open Alert Center</a>`:`<div class="noc-detail-status"><span class="badge ${d.status==='Warning'?'warning':'success'}">${esc(d.status)}</span><strong>${esc(d.type)}</strong></div><dl class="noc-detail-list"><div><dt>Zone</dt><dd>${esc(d.zone)}</dd></div><div><dt>Identity</dt><dd>${esc(d.meta)}</dd></div><div><dt>Frontend state</dt><dd>Demonstration data</dd></div></dl><div class="noc-drawer-actions"><a class="button primary noc-route" href="${d.route}">Open ${esc(d.type)}</a><button type="button" class="button" data-noc-topology="${esc(d.id)}">Trace in topology</button></div>`;
    drawer.classList.add('open');drawer.setAttribute('aria-hidden','false');
    window.ISPApp.selectedDevice=id;
    window.dispatchEvent(new CustomEvent('isp:device-selected',{detail:{id,record:d}}));
  }
  function closeDrawer(){const d=document.getElementById('nocDeviceDrawer');if(d){d.classList.remove('open');d.setAttribute('aria-hidden','true');}}
  function injectDashboard(){
    const page=document.querySelector('#dashboard');if(!page||document.getElementById('nocHealthTimeline'))return;
    const card=document.createElement('article');card.id='nocHealthTimeline';card.className='card panel noc-enhancement-panel';card.innerHTML=`<div class="panel-head"><div><span class="eyebrow">NOC HEALTH / TIMELINE</span><h3>Operational health</h3></div><span class="badge success">Frontend model</span></div><div class="noc-health-grid"><div class="noc-health-score"><strong>97.8%</strong><span>Composite network health</span><div class="health-meter"><span style="width:97.8%"></span></div></div><div class="noc-timeline"><div><i></i><span><strong>Optical warning detected</strong><small>OLT-S01 · South · 8 min ago</small></span></div><div><i></i><span><strong>Router health check passed</strong><small>Core-01 · 14 min ago</small></span></div><div><i></i><span><strong>Alert review queue updated</strong><small>Alert Center · 21 min ago</small></span></div></div></div>`;
    const roadmap=page.querySelector('.roadmap');roadmap?.before(card);
  }
  function wireCrossLinks(){
    document.addEventListener('click',e=>{
      const result=e.target.closest('[data-noc-result]');if(result){const id=result.dataset.nocResult;closeSearch();openDevice(id);return;}
      const topo=e.target.closest('[data-noc-topology]');if(topo){closeDrawer();location.hash='#topology';setTimeout(()=>window.ISPApp.topologySelect?.(topo.dataset.nocTopology.toLowerCase()),250);return;}
      const node=e.target.closest('.topology-node[data-node]');if(node){openDevice(node.dataset.node==='core'?'Core-01':node.dataset.node==='olt3'?'OLT-S01':node.dataset.node==='onu3'?'ONU-118':node.dataset.node);}
    });
    document.getElementById('searchButton')?.addEventListener('click',openSearch);
    document.getElementById('notificationButton')?.addEventListener('click',()=>openSearch());
    document.addEventListener('click',e=>{const close=e.target.closest('[data-noc-close]');if(!close)return;if(close.dataset.nocClose==='search')closeSearch();else closeDrawer();});
    document.getElementById('nocSearchInput')?.addEventListener('input',e=>renderSearch(e.target.value));
    document.addEventListener('keydown',e=>{if(e.key==='/'&&!/input|textarea/i.test(document.activeElement?.tagName)){e.preventDefault();openSearch();}if(e.key==='Escape'){closeSearch();closeDrawer();}});
  }
  function init(){ensureLayer();injectDashboard();wireCrossLinks();window.ISPApp.nocEnhancementsReady=true;window.dispatchEvent(new CustomEvent('isp:noc-enhancements-ready'))}
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();
})();
