window.ISPApp=window.ISPApp||{};
(function(){
  const route='oltServers';
  const esc=value=>String(value??'—').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  function root(){
    let el=document.querySelector('[data-view="'+route+'"]');
    if(el)return el;
    const main=document.querySelector('main.main');if(!main)return null;
    el=document.createElement('section');el.className='content mikrotik-page';el.dataset.view=route;el.hidden=true;main.appendChild(el);return el;
  }
  function setStatus(message,kind=''){
    const el=document.querySelector('[data-olt-connect-status]');if(el){el.textContent=message;el.className='status-pill '+kind;}
  }
  function values(){
    const form=document.querySelector('[data-olt-connect-form]');
    const data=Object.fromEntries(new FormData(form).entries());
    ['port','timeout_seconds','pop_id'].forEach(k=>{if(data[k]==='')delete data[k];else if(data[k]!=null)data[k]=Number(data[k]);});
    return data;
  }
  async function test(){
    const api=window.ISPApp.apiClient;
    if(!api?.isConfigured()){setStatus('Backend not configured','warning');return;}
    const form=document.querySelector('[data-olt-connect-form]');if(!form.reportValidity())return;
    setStatus('Testing SNMP access…');
    try{
      const v=values();const result=await api.oltTestConnection({host:v.host,community:v.community,port:v.port,timeout_seconds:v.timeout_seconds,vendor:v.vendor});
      setStatus('SNMP reachable','success');
      const details=document.querySelector('[data-olt-probe-result]');
      if(details)details.textContent='Reachable · '+(result.data?.sys_name||result.data?.sys_descr||'SNMP agent responded')+' · Generic system probe only; vendor PON/ONU telemetry requires a validated MIB profile.';
    }catch(e){setStatus('Connection test failed','error');const details=document.querySelector('[data-olt-probe-result]');if(details)details.textContent=e.message||'SNMP probe failed';}
  }
  async function save(){
    const api=window.ISPApp.apiClient;
    if(!api?.isConfigured()){setStatus('Backend not configured','warning');return;}
    const form=document.querySelector('[data-olt-connect-form]');if(!form.reportValidity())return;
    const v=values();setStatus('Saving encrypted configuration…');
    try{
      await api.oltCreateServer(v);form.elements.community.value='';setStatus('Configuration saved','success');
      const details=document.querySelector('[data-olt-probe-result]');if(details)details.textContent='Saved to backend. No device connection is performed by Save Configuration.';
      await refresh();
    }catch(e){setStatus('Save failed','error');const details=document.querySelector('[data-olt-probe-result]');if(details)details.textContent=e.message||'Could not save OLT configuration';}
  }
  async function refresh(){
    const target=document.querySelector('[data-olt-server-list]');if(!target)return;
    const api=window.ISPApp.apiClient;
    if(!api?.isConfigured()){target.innerHTML='<div class="empty-state">Backend origin is not configured. Inventory will appear after the API is deployed and configured.</div>';return;}
    try{
      const result=await api.oltServers();const items=result?.items||[];
      if(!items.length){target.innerHTML='<div class="empty-state">No OLT configurations saved.</div>';return;}
      target.innerHTML=items.map(x=>'<div class="device-row"><div><strong>'+esc(x.name)+'</strong><span>'+esc(x.vendor)+' · '+esc(x.host)+':'+esc(x.port)+' · '+esc(x.model||'Model not set')+'</span></div><div class="device-actions"><span class="badge">'+esc(x.status)+'</span><button class="btn btn-secondary" type="button" data-olt-server-action="probe" data-id="'+Number(x.id)+'">Probe</button><button class="btn btn-danger" type="button" data-olt-server-action="delete" data-id="'+Number(x.id)+'">Delete</button></div></div>').join('');
      target.querySelectorAll('[data-olt-server-action]').forEach(b=>b.addEventListener('click',()=>serverAction(b.dataset.oltServerAction,Number(b.dataset.id))));
    }catch(e){target.innerHTML='<div class="empty-state">Inventory unavailable: '+esc(e.message)+'</div>';}
  }
  async function serverAction(action,id){
    const api=window.ISPApp.apiClient;
    try{
      if(action==='probe'){setStatus('Probing saved OLT…');const result=await api.oltProbe(id);setStatus('SNMP reachable','success');const details=document.querySelector('[data-olt-probe-result]');if(details)details.textContent=JSON.stringify(result.data||{});}
      if(action==='delete'){if(!confirm('Delete this OLT configuration and its related inventory?'))return;await api.oltDeleteServer(id);setStatus('Configuration deleted','success');}
      await refresh();
    }catch(e){setStatus('Operation failed','error');const details=document.querySelector('[data-olt-probe-result]');if(details)details.textContent=e.message||'OLT operation failed';await refresh();}
  }
  function render(){
    const el=root();if(!el||el.dataset.rendered==='true')return;
    el.dataset.rendered='true';
    el.innerHTML=`<section class="page-section mikrotik-login-page"><header class="page-hero"><div><span class="eyebrow">Infrastructure / OLT / SNMP</span><h2>Add &amp; Configure OLT</h2><p>Prepare OLT connection settings now. Saving stores encrypted configuration; a probe is a separate action.</p></div><div class="page-actions"><button class="btn btn-secondary" type="button" data-olt-action="test">Test SNMP</button><button class="btn btn-primary" type="button" data-olt-action="save">Save Configuration</button></div></header><div class="grid-2"><article class="panel"><div class="panel-header"><div><h3>OLT Connection Profile</h3><p>SNMP v2c system probe profile</p></div><span class="status-pill" data-olt-connect-status>Not tested</span></div><form data-olt-connect-form autocomplete="off"><div class="form-grid"><label>Configuration Name<input name="name" required maxlength="160" placeholder="North POP OLT 01"></label><label>Management Host / IP<input name="host" required maxlength="255" placeholder="192.168.10.2"></label><label>Vendor<select name="vendor" required><option value="vsol">VSOL</option><option value="huawei">Huawei</option><option value="zte">ZTE</option><option value="bdcom">BDCOM</option></select></label><label>SNMP Community<input name="community" type="password" required maxlength="255" autocomplete="new-password" placeholder="SNMP community"></label><label>SNMP Port<input name="port" type="number" min="1" max="65535" value="161" required></label><label>Timeout (seconds)<input name="timeout_seconds" type="number" min="0.5" max="30" step="0.5" value="3" required></label><label>Model<input name="model" maxlength="120" placeholder="MA5800 / C320 / V1600"></label><label>POP ID (optional)<input name="pop_id" type="number" min="1" step="1" placeholder="Existing POP ID"></label></div><p class="form-note">Save Configuration does not contact the OLT. Test SNMP and Probe are explicit actions.</p></form><p class="form-note" data-olt-probe-result aria-live="polite">No probe has been run.</p></article><article class="panel"><div class="panel-header"><div><h3>Preparation Status</h3><p>What the generic connector can verify</p></div></div><ul class="check-list"><li>SNMP v2c reachability and community authentication</li><li>System description, system name and uptime OIDs</li><li>Encrypted community storage in backend database</li><li>Saved inventory, probe status and audit record</li></ul><div class="callout warning"><strong>Telemetry boundary:</strong> PON port counts, ONU registration, RX/TX optical power and vendor alarms require validated Huawei/ZTE/VSOL/BDCOM MIB profiles. The generic probe does not fabricate these metrics.</div></article></div><article class="panel"><div class="panel-header"><div><h3>Configured OLT Inventory</h3><p>Stored backend profiles and latest probe state</p></div><button class="btn btn-secondary" type="button" data-olt-action="refresh">Refresh</button></div><div data-olt-server-list><div class="empty-state">Loading OLT inventory…</div></div></article></section>`;
    el.querySelectorAll('[data-olt-action]').forEach(b=>b.addEventListener('click',()=>({test,save,refresh}[b.dataset.oltAction]||(()=>{}))()));
    window.ISPApp.router?.apply?.();refresh();
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',render,{once:true});else render();
})();
