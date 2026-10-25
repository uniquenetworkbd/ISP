window.ISPApp = window.ISPApp || {};
(function () {
  let mounted = false, selectedId = null, refreshTimer = null;
  const esc = value => String(value ?? '—').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const api = () => window.ISPApp.apiClient;
  const configured = () => api()?.isConfigured?.();
  function mount() {
    if (mounted || !document.querySelector('.app-shell')) return;
    mounted = true;
    const section = document.createElement('section');
    section.className = 'content mikrotik-page';
    section.id = 'mikrotikOperationsPage';
    section.dataset.view = 'mikrotik';
    section.hidden = true;
    section.innerHTML = `
      <div class="hero-row"><div><p class="eyebrow">NETWORK OPERATIONS / ROUTEROS</p><h2>MikroTik Live Operations</h2><p class="muted">এই পেজে শুধু saved MikroTik connection থেকে প্রকৃত live telemetry, PPP user inventory ও scan operation দেখানো হবে। কোনো ডেমো device বা fabricated live metric ব্যবহার করা হবে না।</p></div><div class="page-actions"><a class="btn btn-secondary" href="#mikrotikServers" data-route="mikrotikServers">Manage Connections</a><button class="btn btn-secondary" id="mtOpsRefresh">Refresh</button></div></div>
      <div class="callout warning" id="mtOpsNotice">Live state will appear only after the backend is configured and a real device request succeeds.</div>
      <div class="card panel"><div class="panel-head"><div><span class="eyebrow">SAVED DEVICES</span><h3>Select Router</h3></div><span id="mtOpsUpdated" class="status-pill">Not queried</span></div><div id="mtOpsDeviceList" class="device-list"><div class="empty-state">Loading configured MikroTik devices…</div></div></div>
      <div class="mikrotik-summary" id="mtOpsMetrics"><article class="card kpi mikrotik-kpi"><span class="label">Connection</span><strong>Unknown</strong><span class="kpi-sub">No live request yet</span></article><article class="card kpi mikrotik-kpi"><span class="label">Live fields</span><strong>—</strong><span class="kpi-sub">No telemetry returned</span></article><article class="card kpi mikrotik-kpi"><span class="label">PPPoE inventory</span><strong>—</strong><span class="kpi-sub">Not scanned</span></article><article class="card kpi mikrotik-kpi"><span class="label">Last successful probe</span><strong>—</strong><span class="kpi-sub">Not verified</span></article></div>
      <div class="mikrotik-grid"><article class="card panel"><div class="panel-head"><div><span class="eyebrow">LIVE ROUTEROS RESPONSE</span><h3>Live Telemetry</h3></div><button class="btn btn-secondary" id="mtOpsLive">Fetch Live Data</button></div><div id="mtOpsLiveData" class="mtk-live-grid"><div class="empty-state">Select a configured router and fetch live data.</div></div></article>
      <article class="card panel"><div class="panel-head"><div><span class="eyebrow">PPP / USER INVENTORY</span><h3>Saved User Snapshot</h3></div><div class="page-actions"><button class="btn btn-secondary" id="mtOpsScan">Scan / Sync</button><button class="btn btn-secondary" id="mtOpsUsers">Reload Users</button></div></div><div id="mtOpsUsersData"><div class="empty-state">Select a router to load stored user inventory.</div></div></article></div>`;
    document.querySelector('.main').appendChild(section);
    section.querySelector('#mtOpsRefresh').addEventListener('click', loadDevices);
    section.querySelector('#mtOpsLive').addEventListener('click', loadLive);
    section.querySelector('#mtOpsScan').addEventListener('click', scan);
    section.querySelector('#mtOpsUsers').addEventListener('click', loadUsers);
    section.querySelector('#mtOpsDeviceList').addEventListener('click', event => {
      const button = event.target.closest('[data-select-router]');
      if (button) { selectedId = String(button.dataset.selectRouter); renderSelected(); loadLive(); loadUsers(); }
    });
    window.addEventListener('isp:route', event => {
      if (event.detail.route === 'mikrotik') { loadDevices(); if (refreshTimer) clearInterval(refreshTimer); refreshTimer = setInterval(() => { if (window.ISPApp.router?.current() === 'mikrotik' && selectedId) loadLive(); }, 60000); }
      else if (refreshTimer) { clearInterval(refreshTimer); refreshTimer = null; }
    });
    window.ISPApp.router?.apply?.();
  }
  async function loadDevices() {
    const target = document.querySelector('#mtOpsDeviceList'); if (!target) return;
    if (!configured()) { target.innerHTML = '<div class="empty-state">Backend API is not configured. No live device state is available.</div>'; notice('Backend API not configured', 'warning'); return; }
    target.innerHTML = '<div class="empty-state">Loading saved router configurations…</div>';
    try {
      const result = await api().mikrotikServers(), items = result.items || [];
      if (!items.length) { target.innerHTML = '<div class="empty-state">No saved MikroTik connections. Open Manage Connections to add one.</div>'; return; }
      if (!selectedId || !items.some(x => String(x.id) === String(selectedId))) selectedId = String(items[0].id);
      target.innerHTML = items.map(x => `<div class="device-row ${String(x.id)===String(selectedId)?'is-selected':''}"><div><strong>${esc(x.name)}</strong><span>${esc(x.server_ip)}:${esc(x.port)} · ${esc(x.protocol)} · RouterOS ${esc(x.routeros_version||'version unknown')}</span><small>Persisted status: ${esc(x.status)} · Last successful live: ${esc(x.last_live_at||'Never')}</small></div><div class="device-actions"><span class="badge ${x.status==='online'?'success':''}">${esc(x.status)}</span><button type="button" class="btn btn-secondary" data-select-router="${Number(x.id)}">Open Operations</button></div></div>`).join('');
      const chosen = items.find(x => String(x.id) === String(selectedId));
      if (chosen) await renderSelected(chosen);
    } catch (error) { target.innerHTML = '<div class="empty-state">Device inventory request failed: ' + esc(error.message) + '</div>'; notice('Device inventory unavailable', 'error'); }
  }
  async function renderSelected(device) {
    const target = document.querySelector('#mtOpsDeviceList');
    if (target && device) target.querySelectorAll('[data-select-router]').forEach(b => b.closest('.device-row')?.classList.toggle('is-selected', String(b.dataset.selectRouter) === String(selectedId)));
    if (!device && configured()) { try { const result = await api().mikrotikServers(); device = (result.items||[]).find(x => String(x.id) === String(selectedId)); } catch {} }
    const metrics = document.querySelector('#mtOpsMetrics');
    if (metrics) metrics.innerHTML = [
      ['Connection', device?.status || 'Unknown', 'Saved backend status; live test is separate'],
      ['Protocol', device?.protocol || '—', 'Configured transport'],
      ['PPPoE inventory', device?.user_count ?? '—', 'Saved snapshot count'],
      ['Last successful probe', device?.last_live_at || 'Never', 'Backend persisted timestamp']
    ].map(([label,value,sub]) => `<article class="card kpi mikrotik-kpi"><span class="label">${esc(label)}</span><strong>${esc(value)}</strong><span class="kpi-sub">${esc(sub)}</span></article>`).join('');
  }
  function notice(message, kind='') { const el=document.querySelector('#mtOpsNotice'); if(el){el.textContent=message;el.className='callout '+(kind||'');} }
  async function loadLive() {
    if (!selectedId) return notice('Select a saved router first.', 'warning');
    if (!configured()) return notice('Backend API is not configured. No live request was sent.', 'warning');
    const box=document.querySelector('#mtOpsLiveData'); box.innerHTML='<div class="empty-state">Requesting live data from RouterOS…</div>';
    try {
      const result=await api().mikrotikLive(selectedId), data=result?.data||{};
      const entries=Object.entries(data);
      box.innerHTML=entries.length?entries.map(([key,value])=>`<div class="card mtk-live-card"><span>${esc(key.replaceAll('_',' '))}</span><strong>${esc(typeof value==='object'?JSON.stringify(value):value)}</strong><small>Observed: ${esc(result.observed_at||'timestamp not supplied')}</small></div>`).join(''):'<div class="empty-state">The backend returned no telemetry fields. No values have been fabricated.</div>';
      notice('Live API request succeeded · observed at '+(result.observed_at||'time not supplied'), 'success');
      const updated=document.querySelector('#mtOpsUpdated'); if(updated)updated.textContent='Updated '+(result.observed_at||new Date().toISOString());
      await loadDevices();
    } catch(error) { box.innerHTML='<div class="empty-state">Live request failed: '+esc(error.message)+'</div>'; notice('Device is not confirmed live: '+(error.message||'request failed'), 'error'); }
  }
  async function loadUsers() {
    if (!selectedId) return;
    const box=document.querySelector('#mtOpsUsersData');
    if (!configured()) { box.innerHTML='<div class="empty-state">Backend API is not configured.</div>'; return; }
    box.innerHTML='<div class="empty-state">Loading persisted PPP user snapshot…</div>';
    try {
      const result=await api().mikrotikUsers(selectedId), items=result.items||[];
      box.innerHTML=items.length?'<div class="table-wrap"><table class="mikrotik-table"><thead><tr><th>Username</th><th>Profile</th><th>Service</th><th>Assigned IP</th><th>Snapshot status</th><th>Last sync</th></tr></thead><tbody>'+items.map(x=>'<tr><td><strong>'+esc(x.username)+'</strong></td><td>'+esc(x.service_profile||'—')+'</td><td>'+esc(x.service||'—')+'</td><td>'+esc(x.assigned_ip||'—')+'</td><td>'+esc(x.status_snapshot)+'</td><td>'+esc(x.last_synced_at)+'</td></tr>').join('')+'</tbody></table></div>':'<div class="empty-state">No persisted PPP user snapshot. Run Scan / Sync to collect inventory.</div>';
    } catch(error) { box.innerHTML='<div class="empty-state">User inventory unavailable: '+esc(error.message)+'</div>'; }
  }
  async function scan() {
    if (!selectedId) return notice('Select a saved router first.', 'warning');
    if (!configured()) return notice('Backend API is not configured. No scan was started.', 'warning');
    notice('Scanning RouterOS PPP inventory…');
    try { const result=await api().mikrotikScan(selectedId); notice('Scan completed · '+result.users_scanned+' users scanned, '+result.active_users+' active sessions at '+result.synced_at, 'success'); await loadUsers(); await loadDevices(); }
    catch(error) { notice('Scan failed: '+(error.message||'request failed'), 'error'); }
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', mount, {once:true}); else mount();
})();