window.ISPApp = window.ISPApp || {};
(function(){
  let mounted = false;
  let selectedId = null;
  const esc = value => String(value ?? '').replace(/[&<>\"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','\"':'&quot;',"'":'&#39;'}[c]));
  const view = () => document.querySelector('[data-view="mikrotikServers"]');

  function mount(){
    if(mounted || !document.querySelector('.app-shell')) return;
    mounted = true;
    const section = document.createElement('section');
    section.className = 'content mikrotik-server-manager';
    section.dataset.view = 'mikrotikServers';
    section.hidden = true;
    section.innerHTML = `
      <div class="hero-row"><div><p class="eyebrow">MIKROTIK SERVER / MANAGEMENT</p><h2>All MikroTik Servers</h2><p class="muted">Connect, scan user inventory once, then monitor only changing live data.</p></div><div class="badge success"><span class="status-dot"></span> Backend-ready</div></div>
      <div class="mtk-grid">
        <article class="card panel"><div class="panel-head"><div><span class="eyebrow">ADD SERVER</span><h3>MikroTik Connection</h3></div></div>
          <form id="mtkServerForm" class="mtk-form">
            <label>Server Name<input name="name" required placeholder="Core-MikroTik-01"></label>
            <label>Server IP<input name="server_ip" required placeholder="10.0.0.1"></label>
            <div class="mtk-two"><label>Username<input name="username" required></label><label>Password<input name="password" type="password" required></label></div>
            <div class="mtk-three"><label>Port<input name="port" type="number" value="443" min="1" max="65535"></label><label>Timeout<input name="timeout_seconds" type="number" value="10" min="1" max="120"></label><label>Access<select name="access_mode"><option value="read">Read</option><option value="write">Write</option><option value="full">Full</option></select></label></div>
            <div class="mtk-actions"><button type="button" class="btn" id="mtkTest">Test Connection</button><button type="submit" class="btn primary">Save &amp; Connect</button></div>
            <div id="mtkFormStatus" class="mtk-status" aria-live="polite"></div>
          </form>
        </article>
        <article class="card panel"><div class="panel-head"><div><span class="eyebrow">USER INVENTORY</span><h3>Stored User Information</h3></div><div class="mtk-actions"><input id="mtkUserSearch" class="mtk-search" placeholder="Search user"><button type="button" class="btn" id="mtkScan">Scan / Sync</button></div></div><div id="mtkUsers"><div class="empty-state">Select a MikroTik server to view stored users.</div></div></article>
      </div>
      <article class="card panel"><div class="panel-head"><div><span class="eyebrow">SERVER INVENTORY</span><h3>All MikroTik Servers</h3></div><button type="button" class="btn" id="mtkRefresh">Refresh</button></div><div class="table-wrap"><table class="mtk-table"><thead><tr><th>Serial</th><th>Server Name</th><th>Server IP</th><th>Username</th><th>Port</th><th>Version</th><th>Timeout</th><th>Access</th><th>Status</th><th>Action</th></tr></thead><tbody id="mtkServers"><tr><td colspan="10" class="empty-state">Loading…</td></tr></tbody></table></div></article>
      <article class="card panel"><div class="panel-head"><div><span class="eyebrow">LIVE TELEMETRY</span><h3>Current Server Data</h3></div><button type="button" class="btn" id="mtkLive">Refresh Live</button></div><div id="mtkLiveData" class="mtk-live-grid"><div class="empty-state">Select a server.</div></div></article>`;
    document.querySelector('.main').appendChild(section);
    window.addEventListener('isp:route', event => { if(event.detail.route === 'mikrotikServers') loadServers(); });
    section.querySelector('#mtkRefresh').addEventListener('click', loadServers);
    section.querySelector('#mtkScan').addEventListener('click', scanSelected);
    section.querySelector('#mtkLive').addEventListener('click', loadLive);
    section.querySelector('#mtkTest').addEventListener('click', testConnection);
    section.querySelector('#mtkUserSearch').addEventListener('input', () => loadUsers());
    section.querySelector('#mtkServerForm').addEventListener('submit', saveServer);
    section.querySelector('#mtkServers').addEventListener('click', event => { const button=event.target.closest('[data-select-server]'); if(button){selectedId=button.dataset.selectServer; loadUsers(); loadLive();}});
    addNavLink();
  }

  function addNavLink(){
    const nav=document.querySelector('#primaryNav');
    if(nav && !nav.querySelector('[data-route="mikrotikServers"]')){
      const a=document.createElement('a'); a.className='nav-item'; a.href='#mikrotikServers'; a.dataset.route='mikrotikServers'; a.innerHTML='<span class="nav-icon">▦</span><span>MikroTik Servers</span>'; nav.appendChild(a);
    }
  }

  function api(){return window.ISPApp.apiClient;}
  function configured(){return api()?.isConfigured?.();}
  function setStatus(message, good=false){const el=document.querySelector('#mtkFormStatus'); if(el){el.textContent=message; el.className=`mtk-status ${good?'good':''}`;}}

  async function testConnection(){
    const form=document.querySelector('#mtkServerForm'); const data=Object.fromEntries(new FormData(form).entries());
    if(!configured()){setStatus('Backend API is not configured.');return;}
    setStatus('Testing connection…');
    try{const result=await api().mikrotikTestConnection({server_ip:data.server_ip,username:data.username,password:data.password,port:Number(data.port),timeout_seconds:Number(data.timeout_seconds)}); setStatus(`Connected${result.version?` — RouterOS ${result.version}`:''}`,true);}catch(error){setStatus(error.message);}
  }

  async function saveServer(event){
    event.preventDefault();
    if(!configured()){setStatus('Backend API is not configured.');return;}
    const data=Object.fromEntries(new FormData(event.target).entries());
    setStatus('Saving encrypted credentials and server…');
    try{await api().mikrotikCreateServer({...data,port:Number(data.port),timeout_seconds:Number(data.timeout_seconds)}); setStatus('Server saved.',true); event.target.reset(); event.target.port.value=443; event.target.timeout_seconds.value=10; await loadServers();}catch(error){setStatus(error.message);}
  }

  async function loadServers(){
    const tbody=document.querySelector('#mtkServers'); if(!tbody)return;
    if(!configured()){tbody.innerHTML='<tr><td colspan="10" class="empty-state">Configure the Backend API to load MikroTik servers.</td></tr>';return;}
    try{const result=await api().mikrotikServers(); const items=result.items||[]; tbody.innerHTML=items.length?items.map((item,index)=>`<tr><td>${index+1}</td><td><strong>${esc(item.name)}</strong></td><td>${esc(item.server_ip)}</td><td>${esc(item.username)}</td><td>${esc(item.port)}</td><td>${esc(item.routeros_version||'—')}</td><td>${esc(item.timeout_seconds)}s</td><td><span class="badge">${esc(item.access_mode)}</span></td><td><span class="badge ${item.status==='online'?'success':''}">${esc(item.status)}</span></td><td><button class="btn small" data-select-server="${item.id}">Open</button></td></tr>`).join(''):'<tr><td colspan="10" class="empty-state">No MikroTik servers configured.</td></tr>';}catch(error){tbody.innerHTML=`<tr><td colspan="10" class="empty-state">${esc(error.message)}</td></tr>`;}
  }

  async function scanSelected(){
    if(!selectedId){setStatus('Select a server first.');return;} if(!configured())return;
    setStatus('Scanning MikroTik user inventory…');
    try{const result=await api().mikrotikScan(selectedId);setStatus(`Sync complete: ${result.users_scanned} users, ${result.active_users} active.`,true);await loadUsers();await loadServers();}catch(error){setStatus(error.message);}
  }

  async function loadUsers(){
    const box=document.querySelector('#mtkUsers'); if(!box||!selectedId||!configured())return;
    try{const search=document.querySelector('#mtkUserSearch')?.value||'';const result=await api().mikrotikUsers(selectedId,search);const items=result.items||[];box.innerHTML=`<div class="table-wrap"><table class="mtk-table"><thead><tr><th>User</th><th>Customer</th><th>Profile</th><th>IP</th><th>Status</th><th>Last Sync</th></tr></thead><tbody>${items.length?items.map(item=>`<tr><td>${esc(item.username)}</td><td>${esc(item.customer_name||'—')}</td><td>${esc(item.service_profile||'—')}</td><td>${esc(item.last_live_ip||item.assigned_ip||'—')}</td><td>${esc(item.status_snapshot)}</td><td>${esc(item.last_synced_at)}</td></tr>`).join(''):'<tr><td colspan="6" class="empty-state">No stored users. Run Scan / Sync.</td></tr>'}</tbody></table></div>`;}catch(error){box.innerHTML=`<div class="empty-state">${esc(error.message)}</div>`;}
  }

  async function loadLive(){
    const box=document.querySelector('#mtkLiveData'); if(!box||!selectedId||!configured())return;
    try{const result=await api().mikrotikLive(selectedId);const d=result.data||{};box.innerHTML=Object.entries(d).map(([key,value])=>`<div class="card mtk-live-card"><span>${esc(key.replaceAll('_',' '))}</span><strong>${esc(value)}</strong><small>${esc(result.observed_at)}</small></div>`).join('')||'<div class="empty-state">No live telemetry returned.</div>';}catch(error){box.innerHTML=`<div class="empty-state">${esc(error.message)}</div>`;}
  }

  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',mount,{once:true});else mount();
})();
