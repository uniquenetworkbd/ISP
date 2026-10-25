window.ISPApp = window.ISPApp || {};
(function () {
  let mounted = false;
  let selectedId = null;
  const esc = value => String(value ?? '—').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const api = () => window.ISPApp.apiClient;
  const configured = () => api()?.isConfigured?.();
  function status(message, kind = '') {
    const el = document.querySelector('#mtkFormStatus');
    if (el) { el.textContent = message; el.className = 'mtk-status ' + kind; }
  }
  function mount() {
    if (mounted || !document.querySelector('.app-shell')) return;
    mounted = true;
    const section = document.createElement('section');
    section.className = 'content mikrotik-server-manager mikrotik-login-page';
    section.dataset.view = 'mikrotikServers';
    section.hidden = true;
    section.innerHTML = `
      <div class="page-hero"><div><p class="eyebrow">INTEGRATIONS / MIKROTIK</p><h2>MikroTik Connection Center</h2><p class="muted">এই পেজে শুধু MikroTik connection configuration, credential save, connection test ও saved connection management থাকবে। Live telemetry এবং PPPoE operations আলাদা MikroTik Dashboard পেজে থাকবে।</p></div><span class="status-pill">Connection setup only</span></div>
      <div class="callout warning"><strong>বাস্তব সংযোগের নিয়ম</strong><p>Configuration save হলে সেটি database-এ encrypted credential হিসেবে সংরক্ষিত হবে। Connection test সফল না হওয়া পর্যন্ত কোনো ডিভাইসকে Connected দেখানো হবে না। Backend API configure না থাকলে save/test চালানো হবে না।</p></div>
      <div class="grid-2">
        <article class="card panel"><div class="panel-head"><div><span class="eyebrow">NEW CONNECTION</span><h3>Add MikroTik</h3></div></div>
          <form id="mtkServerForm" class="form-grid">
            <label>Connection Name<input name="name" required maxlength="160" placeholder="Core-Router-01"></label>
            <label>Management Host / IP<input name="server_ip" required maxlength="255" placeholder="router.example.net or 10.0.0.1"></label>
            <label>RouterOS Username<input name="username" required autocomplete="username" maxlength="120"></label>
            <label>RouterOS Password<input name="password" required type="password" autocomplete="new-password" maxlength="512"></label>
            <label>Transport Protocol<select name="protocol" id="mtkProtocol"><option value="rest">RouterOS REST (HTTPS)</option><option value="api">RouterOS API (TCP)</option><option value="api_ssl">RouterOS API-SSL (TLS)</option></select></label>
            <label>Port<input name="port" id="mtkPort" type="number" min="1" max="65535" value="443" required></label>
            <label>Connection Timeout (seconds)<input name="timeout_seconds" type="number" min="1" max="120" value="10" required></label>
            <label>Access Mode<select name="access_mode"><option value="read">Read only</option><option value="write">Read / Write</option><option value="full">Full access</option></select></label>
            <label>Model (optional)<input name="model" maxlength="120" placeholder="CCR / RB series"></label>
            <div class="page-actions"><button type="button" class="btn btn-secondary" id="mtkTest">Test Unsaved Details</button><button type="submit" class="btn primary" id="mtkSave">Save Configuration &amp; Verify</button></div>
            <div id="mtkFormStatus" class="status-pill" aria-live="polite">Ready. Enter the connection details.</div>
          </form>
        </article>
        <article class="card panel"><div class="panel-head"><div><span class="eyebrow">CONNECTION WORKFLOW</span><h3>How connection setup works</h3></div></div>
          <ol class="check-list"><li>Choose REST, API or API-SSL transport.</li><li>Save configuration; credentials are encrypted on the backend.</li><li>Run a real RouterOS probe and inspect the returned result.</li><li>Review saved connection history below.</li><li>Open <a href="#mikrotik" data-route="mikrotik">MikroTik Dashboard</a> for live data and operations.</li></ol>
          <div class="form-note"><strong>Security:</strong> saved passwords are never returned to the browser after save. Use a least-privilege RouterOS account where possible.</div>
        </article>
      </div>
      <article class="card panel"><div class="panel-head"><div><div class="eyebrow">SAVED CONFIGURATIONS</div><h3>Configured MikroTik Devices</h3></div><button type="button" class="btn btn-secondary" id="mtkRefresh">Refresh</button></div><div id="mtkServers" class="device-list"><div class="empty-state">Loading saved configurations…</div></div></article>
      <article class="card panel"><div class="panel-head"><div><div class="eyebrow">AUDITABLE CONNECTION CHECKS</div><h3>Connection Test History</h3></div><button type="button" class="btn btn-secondary" id="mtkHistoryRefresh">Refresh History</button></div><div id="mtkHistory" class="table-wrap"><div class="empty-state">Select a saved configuration to view connection history.</div></div></article>`;
    document.querySelector('.main').appendChild(section);
    section.querySelector('#mtkProtocol').addEventListener('change', event => {
      section.querySelector('#mtkPort').value = ({rest:443,api:8728,api_ssl:8729})[event.target.value];
    });
    section.querySelector('#mtkServerForm').addEventListener('submit', save);
    section.querySelector('#mtkTest').addEventListener('click', testUnsaved);
    section.querySelector('#mtkRefresh').addEventListener('click', loadServers);
    section.querySelector('#mtkHistoryRefresh').addEventListener('click', loadHistory);
    section.querySelector('#mtkServers').addEventListener('click', event => {
      const button = event.target.closest('[data-mtk-action]');
      if (!button) return;
      selectedId = button.dataset.id;
      if (button.dataset.mtkAction === 'test') testSaved(selectedId);
      if (button.dataset.mtkAction === 'history') loadHistory();
      if (button.dataset.mtkAction === 'delete') removeServer(selectedId);
    });
    window.addEventListener('isp:route', event => { if (event.detail.route === 'mikrotikServers') loadServers(); });
    addNavLink();
    window.ISPApp.router?.apply?.();
  }
  function addNavLink() {
    const nav = document.querySelector('#primaryNav');
    if (nav && !nav.querySelector('[data-route="mikrotikServers"]')) {
      const a = document.createElement('a'); a.className = 'nav-item'; a.href = '#mikrotikServers'; a.dataset.route = 'mikrotikServers';
      a.innerHTML = '<span class="nav-icon">＋</span><span>Connect MikroTik</span>'; nav.appendChild(a);
    }
  }
  function formValues() {
    const form = document.querySelector('#mtkServerForm');
    const data = Object.fromEntries(new FormData(form).entries());
    data.port = Number(data.port); data.timeout_seconds = Number(data.timeout_seconds);
    return data;
  }
  async function testUnsaved() {
    const form = document.querySelector('#mtkServerForm');
    if (!form.reportValidity()) return;
    if (!configured()) return status('Backend API is not configured. No connection request was sent.', 'warning');
    status('Testing the supplied RouterOS endpoint…');
    try {
      const result = await api().mikrotikTestConnection(formValues());
      status('Real connection probe succeeded' + (result.version ? ' · RouterOS ' + result.version : '') + '. This configuration is not saved yet.', 'success');
    } catch (error) { status('Connection test failed: ' + (error.message || 'request failed'), 'error'); }
  }
  async function save(event) {
    event.preventDefault();
    if (!configured()) return status('Backend API is not configured. Nothing was saved.', 'warning');
    const form = event.currentTarget;
    if (!form.reportValidity()) return;
    const data = formValues();
    status('Saving encrypted configuration…');
    let saved;
    try {
      saved = await api().mikrotikCreateServer(data);
      selectedId = String(saved.id);
      form.elements.password.value = '';
      status('Configuration saved. Running a real connection test…');
      await testSaved(selectedId);
      form.reset(); form.elements.protocol.value = 'rest'; form.elements.port.value = 443; form.elements.timeout_seconds.value = 10;
      await loadServers();
    } catch (error) {
      status(saved ? 'Configuration was saved, but verification failed: ' + (error.message || 'connection error') : 'Save failed: ' + (error.message || 'request error'), 'error');
      await loadServers();
    }
  }
  async function testSaved(id) {
    if (!configured()) return status('Backend API is not configured.', 'warning');
    status('Testing saved RouterOS configuration…');
    try {
      const result = await api().mikrotikTestSavedServer(id);
      status('Saved configuration verified · ' + result.status + (result.routeros_version ? ' · RouterOS ' + result.routeros_version : ''), result.status === 'connected' ? 'success' : 'error');
    } catch (error) { status('Saved connection test failed: ' + (error.message || 'connection error'), 'error'); }
    await loadServers(); await loadHistory();
  }
  async function removeServer(id) {
    if (!window.confirm('Delete this saved MikroTik configuration and its stored credential and related inventory?')) return;
    try { await api().mikrotikDeleteServer(id); if (String(selectedId) === String(id)) selectedId = null; status('Configuration deleted.', 'success'); await loadServers(); await loadHistory(); }
    catch (error) { status('Delete failed: ' + (error.message || 'request error'), 'error'); }
  }
  async function loadServers() {
    const target = document.querySelector('#mtkServers'); if (!target) return;
    if (!configured()) { target.innerHTML = '<div class="empty-state">Backend API is not configured. No saved configurations can be loaded.</div>'; return; }
    target.innerHTML = '<div class="empty-state">Loading saved configurations…</div>';
    try {
      const result = await api().mikrotikServers(); const items = result.items || [];
      if (!items.length) { target.innerHTML = '<div class="empty-state">No MikroTik configurations saved yet.</div>'; return; }
      target.innerHTML = items.map(item => `<div class="device-row"><div><strong>${esc(item.name)}</strong><span>${esc(item.server_ip)}:${esc(item.port)} · ${esc(item.protocol)} · ${esc(item.username)} · ${esc(item.model || 'Model not set')}</span><small>Status: ${esc(item.status)} · Last verified: ${esc(item.last_live_at || 'Never')}</small></div><div class="device-actions"><button class="btn btn-secondary" type="button" data-mtk-action="test" data-id="${Number(item.id)}">Test Connection</button><button class="btn btn-secondary" type="button" data-mtk-action="history" data-id="${Number(item.id)}">History</button><button class="btn btn-danger" type="button" data-mtk-action="delete" data-id="${Number(item.id)}">Delete</button></div></div>`).join('');
      if (!selectedId) selectedId = String(items[0].id);
    } catch (error) { target.innerHTML = '<div class="empty-state">Could not load saved configurations: ' + esc(error.message) + '</div>'; }
  }
  async function loadHistory() {
    const target = document.querySelector('#mtkHistory'); if (!target) return;
    if (!selectedId) { target.innerHTML = '<div class="empty-state">Select History on a saved configuration first.</div>'; return; }
    try {
      const result = await api().mikrotikConnectionTests(selectedId, 20); const items = result.items || [];
      target.innerHTML = items.length ? '<table class="mikrotik-table"><thead><tr><th>Checked at</th><th>Protocol</th><th>Result</th><th>Duration</th><th>RouterOS</th><th>Error code</th></tr></thead><tbody>' + items.map(x => '<tr><td>' + esc(x.checked_at) + '</td><td>' + esc(x.protocol) + '</td><td>' + esc(x.status) + '</td><td>' + esc(x.duration_ms == null ? '—' : x.duration_ms + ' ms') + '</td><td>' + esc(x.routeros_version || '—') + '</td><td>' + esc(x.error_code || '—') + '</td></tr>').join('') + '</tbody></table>' : '<div class="empty-state">No saved connection test history yet.</div>';
    } catch (error) { target.innerHTML = '<div class="empty-state">History unavailable: ' + esc(error.message) + '</div>'; }
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', mount, {once:true}); else mount();
})();