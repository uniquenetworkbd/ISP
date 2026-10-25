window.ISPApp = window.ISPApp || {};
(function(){
  let mounted = false;
  let selectedId = null;
  const esc = value => String(value ?? '').replace(/[&<>\"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','\"':'&quot;',"'":'&#39;'}[c]));
  function mount(){
    if(mounted || !document.querySelector('.app-shell')) return;
    mounted = true;
    const section = document.createElement('section');
    section.className = 'content mikrotik-server-manager';
    section.dataset.view = 'mikrotikServers';
    section.hidden = true;
    section.innerHTML = `
      <div class="hero-row"><div><p class="eyebrow">MIKROTIK SERVER / MANAGEMENT</p><h2>Connect MikroTik</h2><p class="muted">Add your MikroTik server here. Test the connection, save the device, then scan PPP users and view live telemetry.</p></div><div class="badge success"><span class="status-dot"></span> Connection Center</div></div>
      <div class="card panel mtk-connect-banner"><div><span class="eyebrow">PRIMARY ACTION</span><h3>Add a MikroTik server</h3><p class="muted">Enter the management address and RouterOS account, then use <strong>Test Connection</strong> before <strong>Save &amp; Connect</strong>.</p></div><button type="button" class="btn primary" id="mtkBannerConnect">＋ Add MikroTik Server</button></div>
      <div class="mtk-grid"><article class="card panel"><div class="panel-head"><div><span class="eyebrow">ADD SERVER</span><h3>MikroTik Connection</h3></div></div>
        <form id="mtkServerForm" class="mtk-form"><label>Server Name<input name="name" required placeholder="Core-MikroTik-01"></label><label>Server IP / Host<input name="server_ip" required placeholder="10.0.0.1"></label><div class="mtk-two"><label>Username<input name="username" required autocomplete="username"></label><label>Password<input name="password" type="password" required autocomplete="new-password"></label></div><div class="mtk-three"><label>Port<input name="port" type="number" value="443" min="1" max="65535"></label><label>Timeout<input name="timeout_seconds" type="number" value="10" min="1" max="120"></label><label>Access<select name="access_mode"><option value="read">Read</option><option value="write">Write</option><option value="full">Full</option></select></label></div><div class="mtk-actions"><button type="button" class="btn" id="mtkTest">Test Connection</button><button type="submit" class="btn primary">Save &amp; Connect</button></div><div id="mtkFormStatus" class="mtk-status" aria-live="polite">Ready — enter your MikroTik details to connect.</div></form></article>
        <article class="card panel"><div class="panel-head"><div><span class="eyebrow">USER INVENTORY</span><h3>Stored User Information</h3></div><div class="mtk-actions"><input id="mtkUserSearch" class="mtk-search" placeholder="Search username / customer / IP"><button type="button" class="btn" id="mtkScan">Scan / Sync</button></div></div><div id="mtkUsers"><div class="empty-state">Connect a MikroTik server, then run Scan / Sync to import stored PPP users.</div></div></article></div>
      <article class="card panel"><div class="panel-head"><div><span class="eyebrow">SERVER INVENTORY</span><h3>Connected MikroTik Servers</h3></div><button type="button" class="btn" id="mtkRefresh">Refresh</button></div><div class="table-wrap"><table class="mtk-table"><thead><tr><th>Serial</th><th>Server Name</th><th>Server IP</th><th>Username</th><th>Port</th><th>Version</th><th>Users</th><th>Timeout</th><th>Access</th><th>Status</th><th>Last Scan</th><th>Last Live</th><th>Action</th></tr></thead><tbody id="mtkServers"><tr><td colspan="13" class="empty-state">No MikroTik server connected yet.</td></tr></tbody></table></div></article>
      <article class="card panel"><div class="panel-head"><div><span class="eyebrow">LIVE TELEMETRY</span><h3>Current Server Data</h3></div><button type="button" class="btn" id="mtkLive">Refresh Live</button></div><div id="mtkLiveData" class="mtk-live-grid"><div class="empty-state">Connect and select a server to view live telemetry.</div></div></article>`;
    document.querySelector('.main').appendChild(section);
    window.addEventListener('isp:route', event => { if(event.detail.route === 'mikrotikServers') { loadServers(); if(selectedId){ loadUsers(); loadLive(); } } });
    section.querySelector('#mtkRefresh').addEventListener('click', loadServers);
    section.querySelector('#mtkScan').addEventListener('click', scanSelected);
    section.querySelector('#mtkLive').addEventListener('click', loadLive);
    section.querySelector('#mtkTest').addEventListener('click', testConnection);
    section.querySelector('#mtkUserSearch').addEventListener('input', () => loadUsers());
    section.querySelector('#mtkServerForm').addEventListener('submit', saveServer);
    section.querySelector('#mtkBannerConnect').addEventListener('click', () => document.querySelector('#mtkServerForm')?.scrollIntoView({behavior:'smooth',block:'start'}));
    section.querySelector('#mtkServers').addEventListener('click', event => { const button=event.target.closest('[data-select-server]'); if(button){selectedId=button.dataset.selectServer; loadUsers(); loadLive();}});
    addNavLink();
    addDashboardConnectAction();
    window.ISPApp.router?.apply?.();
  }
  function addNavLink(){
    const nav=document.querySelector('#primaryNav');
    if(nav && !nav.querySelector('[data-route="mikrotikServers"]')){const a=document.createElement('a');a.className='nav-item';a.href='#mikrotikServers';a.dataset.route='mikrotikServers';a.innerHTML='<span class="nav-icon">▦</span><span>MikroTik Servers</span>';nav.appendChild(a);}
  }
  function addDashboardConnectAction(){
    const hero=document.querySelector('#dashboard .hero-row');
    if(!hero || hero.querySelector('[data-action="connect-mikrotik"]')) return;
    const action=document.createElement('button');
    action.type='button';
    action.className='btn primary mtk-dashboard-connect';
    action.dataset.action='connect-mikrotik';
    action.textContent='＋ Connect MikroTik';
    action.addEventListener('click',()=>{window.location.hash='mikrotikServers';setTimeout(()=>document.querySelector('#mtkServerForm')?.scrollIntoView({behavior:'smooth',block:'start'}),50);});
    hero.appendChild(action);
  }
  function api(){return window.ISPApp.apiClient;}
  function configured(){return api()?.isConfigured?.();}
  function setStatus(message,good=false){const el=document.querySelector('#mtkFormStatus');if(el){el.textContent=message;el.className=`mtk-status ${good?'good':''}`;}}
  function renderServers(items){
    const tbody=document.querySelector('#mtkServers'); if(!tbody)return;
    tbody.innerHTML=items.length?items.map(item=>`<tr><td>${esc(item.id)}</td><td><strong>${esc(item.name)}</strong></td><td>${esc(item.server_ip)}</td><td>${esc(item.username)}</td><td>${esc(item.port)}</td><td>${esc(item.routeros_version||'—')}</td><td>${esc(item.user_count ?? 0)}</td><td>${esc(item.timeout_seconds)}s</td><td><span class="badge">${esc(item.access_mode)}</span></td><td><span class="badge ${item.status==='online'?'success':''}">${esc(item.status)}</span></td><td>${esc(item.last_scan_at||'—')}</td><td>${esc(item.last_live_at||'—')}</td><td><button class="btn small" data-select-server="${esc(item.id)}">Open</button></td></tr>`).join(''):'<tr><td colspan="13" class="empty-state">No MikroTik server connected yet.</td></tr>';
  }
  async function testConnection(){const form=document.querySelector('#mtkServerForm');const data=Object.fromEntries(new FormData(form).entries());if(!configured()){setStatus('Backend is not configured yet. The connection form is ready; Test Connection will call the MikroTik connector after the backend is available.');return;}setStatus('Testing connection…');try{const result=await api().mikrotikTestConnection({server_ip:data.server_ip,username:data.username,password:data.password,port:Number(data.port),timeout_seconds:Number(data.timeout_seconds)});setStatus(`Connected${result.version?` — RouterOS ${result.version}`:''}`,true);}catch(error){setStatus(error.message);}}
  async function saveServer(event){event.preventDefault();const data=Object.fromEntries(new FormData(event.target).entries());if(!configured()){setStatus('Backend is not configured yet. Nothing was saved.');return;}setStatus('Testing and saving server…');try{const test=await api().mikrotikTestConnection({server_ip:data.server_ip,username:data.username,password:data.password,port:Number(data.port),timeout_seconds:Number(data.timeout_seconds)});const saved=await api().mikrotikCreateServer({...data,port:Number(data.port),timeout_seconds:Number(data.timeout_seconds)});selectedId=String(saved.id);setStatus(`Connected${test.version?` — RouterOS ${test.version}`:''}. Server saved.`,true);event.target.reset();event.target.port.value=443;event.target.timeout_seconds.value=10;await loadServers();await loadUsers();await loadLive();}catch(error){setStatus(error.message);}}
  async function loadServers(){if(!configured()){renderServers([]);return;}const tbody=document.querySelector('#mtkServers');if(!tbody)return;try{const result=await api().mikrotikServers();const items=result.items||[];renderServers(items);if(items.length&&!selectedId)selectedId=String(items[0].id);if(selectedId){loadUsers();loadLive();}}catch(error){tbody.innerHTML=`<tr><td colspan="13" class="empty-state">${esc(error.message)}</td></tr>`;}}
  async function scanSelected(){if(!selectedId){setStatus('Select a connected server first.');return;}if(!configured()){setStatus('Backend is not configured yet. Nothing was scanned.');return;}setStatus('Scanning MikroTik PPP user inventory…');try{const result=await api().mikrotikScan(selectedId);setStatus(`Sync complete: ${result.users_scanned} users, ${result.active_users} active.`,true);await loadUsers();await loadServers();}catch(error){setStatus(error.message);}}
  async function loadUsers(){const box=document.querySelector('#mtkUsers');if(!box||!selectedId)return;if(!configured()){box.innerHTML='<div class="empty-state">Connect a MikroTik server to load real user inventory.</div>';return;}try{const search=document.querySelector('#mtkUserSearch')?.value||'';const result=await api().mikrotikUsers(selectedId,search);renderUsers(result.items||[]);}catch(error){box.innerHTML=`<div class="empty-state">${esc(error.message)}</div>`;}}
  function renderUsers(items){const box=document.querySelector('#mtkUsers');if(!box)return;box.innerHTML=`<div class="table-wrap"><table class="mtk-table"><thead><tr><th>Username</th><th>Customer</th><th>Profile</th><th>Service</th><th>Assigned IP</th><th>Caller ID</th><th>Status</th><th>Live IP</th><th>Live Uptime</th><th>Last Sync</th></tr></thead><tbody>${items.length?items.map(item=>`<tr><td><strong>${esc(item.username)}</strong></td><td>${esc(item.customer_name||'—')}</td><td>${esc(item.service_profile||'—')}</td><td>${esc(item.service||'—')}</td><td>${esc(item.assigned_ip||'—')}</td><td>${esc(item.caller_id||'—')}</td><td><span class="badge ${item.status_snapshot==='online'?'success':''}">${esc(item.status_snapshot)}</span></td><td>${esc(item.last_live_ip||'—')}</td><td>${esc(item.last_live_uptime||'—')}</td><td>${esc(item.last_synced_at||'—')}</td></tr>`).join(''):'<tr><td colspan="10" class="empty-state">No stored users. Run Scan / Sync.</td></tr>'}</tbody></table></div>`;}
  async function loadLive(){const box=document.querySelector('#mtkLiveData');if(!box||!selectedId)return;if(!configured()){box.innerHTML='<div class="empty-state">Connect a MikroTik server to view live telemetry.</div>';return;}try{const result=await api().mikrotikLive(selectedId);renderLive(result.data||{},result.observed_at);}catch(error){box.innerHTML=`<div class="empty-state">${esc(error.message)}</div>`;}}
  function renderLive(data,observed){const box=document.querySelector('#mtkLiveData');if(!box)return;box.innerHTML=Object.entries(data).map(([key,value])=>`<div class="card mtk-live-card"><span>${esc(key.replaceAll('_',' '))}</span><strong>${esc(value)}</strong><small>${esc(observed)}</small></div>`).join('')||'<div class="empty-state">No live telemetry returned.</div>';}
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',mount,{once:true});else mount();
})();