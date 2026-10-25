window.ISPApp=window.ISPApp||{};
(function(){
  const route='mikrotikServers';
  function render(){
    const root=document.querySelector('[data-view="mikrotikServers"]');if(!root||root.dataset.connectionPageReady==='true')return;
    root.dataset.connectionPageReady='true';
    root.innerHTML=`<section class="page-section mikrotik-connection-page">
      <header class="page-hero"><div><span class="eyebrow">Infrastructure / MikroTik</span><h2>Connect MikroTik Router</h2><p>Add a RouterOS device, test access, save it securely, then load inventory and live telemetry.</p></div><div class="page-actions"><button class="btn btn-primary" type="button" data-mikrotik-action="test">Test Connection</button><button class="btn btn-secondary" type="button" data-mikrotik-action="save">Save &amp; Connect</button></div></header>
      <div class="grid-2">
        <article class="panel"><div class="panel-header"><div><h3>Connection Details</h3><p>RouterOS REST over HTTPS is the preferred connection path.</p></div><span class="status-pill" data-mikrotik-status>Not tested</span></div>
          <form data-mikrotik-form autocomplete="off">
            <div class="form-grid">
              <label>Server Name<input name="name" required placeholder="Core Router 01"></label>
              <label>Server IP / Host<input name="server_ip" required placeholder="192.168.88.1"></label>
              <label>Username<input name="username" required autocomplete="username" placeholder="monitor"></label>
              <label>Password<input name="password" type="password" required autocomplete="current-password" placeholder="••••••••"></label>
              <label>REST Port<input name="port" type="number" min="1" max="65535" value="443"></label>
              <label>Timeout (seconds)<input name="timeout_seconds" type="number" min="2" max="60" value="10"></label>
              <label>Access Mode<select name="access_mode"><option value="read">Read</option><option value="read_write">Read / Write</option><option value="full">Full</option></select></label>
              <label>Transport<select name="transport"><option value="https">HTTPS / REST</option><option value="http">HTTP / REST (test only)</option></select></label>
            </div>
            <div class="form-note"><strong>Connection flow:</strong> Test → Save → Scan users → Load live telemetry.</div>
          </form>
        </article>
        <article class="panel"><div class="panel-header"><div><h3>Connection Requirements</h3><p>Router-side prerequisites before testing.</p></div></div>
          <ul class="check-list"><li>RouterOS v7 with REST support</li><li><code>www-ssl</code> enabled for HTTPS REST</li><li>Dedicated monitoring user with required policy</li><li>Firewall allows the backend to reach the router</li><li>Valid certificate or explicitly configured trust policy</li></ul>
          <div class="callout warning"><strong>Browser boundary:</strong> GitHub Pages does not connect directly to a private MikroTik. The page sends requests to the configured FastAPI backend; the backend performs the RouterOS connection.</div>
        </article>
      </div>
      <article class="panel"><div class="panel-header"><div><h3>Stored MikroTik Inventory</h3><p>Saved devices, connection status, RouterOS version and user count.</p></div><button class="btn btn-secondary" type="button" data-mikrotik-action="refresh">Refresh</button></div><div data-mikrotik-inventory><div class="empty-state">No stored MikroTik servers loaded.</div></div></article>
    </section>`;
    root.querySelectorAll('[data-mikrotik-action]').forEach(b=>b.addEventListener('click',()=>action(b.dataset.mikrotikAction)));
  }
  function values(){const f=document.querySelector('[data-mikrotik-form');return Object.fromEntries(new FormData(f).entries());}
  async function action(type){
    const status=document.querySelector('[data-mikrotik-status]');
    if(type==='refresh'){return window.ISPApp.apiStore?.loadMikroTikServers?.();}
    const api=window.ISPApp.apiClient;
    if(!api||!window.ISPApp.api?.baseUrl){status.textContent='Backend not configured';window.ISPApp.ui?.toast?.('Configure the FastAPI backend before connecting a MikroTik.','warning');return;}
    try{
      const data=values();
      if(type==='test'){status.textContent='Testing…';const r=await api.testMikroTikConnection(data);status.textContent=r?.status||'Connection OK';window.ISPApp.ui?.toast?.('MikroTik connection test completed.','success');}
      if(type==='save'){status.textContent='Saving…';await api.createMikroTikServer(data);status.textContent='Connected & saved';window.ISPApp.ui?.toast?.('MikroTik server saved.','success');await window.ISPApp.apiStore?.loadMikroTikServers?.();}
    }catch(e){status.textContent='Connection failed';window.ISPApp.ui?.toast?.(e.message||'MikroTik operation failed.','error');}
  }
  document.addEventListener('isp:app-ready',()=>{if(window.ISPApp.router?.current?.()===route)render();});
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',render,{once:true});else render();
})();
