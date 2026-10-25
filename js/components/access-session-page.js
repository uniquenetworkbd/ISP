window.ISPApp=window.ISPApp||{};
(function(){
  const route='access';
  const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  function render(){
    if(document.querySelector('[data-view="access"]'))return;
    const main=document.querySelector('main.main');if(!main)return;
    const root=document.createElement('section');root.className='content mikrotik-page';root.dataset.view=route;root.hidden=true;
    root.innerHTML=`<section class="page-section mikrotik-login-page"><header class="page-hero"><div><span class="eyebrow">System / Access Control</span><h2>Backend Access &amp; Session</h2><p>Sign in to use protected device configuration, monitoring and management APIs.</p></div><span class="status-pill" data-access-status>Checking</span></header><div class="grid-2"><article class="panel"><div class="panel-header"><div><h3>Sign in</h3><p>Credentials are sent to the configured HTTPS API.</p></div></div><form data-access-form autocomplete="on"><div class="form-grid"><label>Username<input name="username" required maxlength="120" autocomplete="username"></label><label>Password<input name="password" type="password" required maxlength="512" autocomplete="current-password"></label></div><div class="page-actions"><button class="btn btn-primary" type="submit">Sign in</button><button class="btn btn-secondary" type="button" data-access-logout>Sign out</button></div></form><p class="form-note" data-access-message aria-live="polite">No request made.</p></article><article class="panel"><div class="panel-header"><div><h3>Current session</h3><p>Server-verified account and roles</p></div><button class="btn btn-secondary" type="button" data-access-refresh>Refresh</button></div><div data-access-session class="empty-state">Session not verified.</div><div class="callout warning"><strong>Initial setup:</strong> create the first administrator using the backend command <code>python -m app.bootstrap_admin</code> with BOOTSTRAP_ADMIN_USERNAME and BOOTSTRAP_ADMIN_PASSWORD set in the server environment.</div></article></div></section>`;
    main.appendChild(root);
    const form=root.querySelector('[data-access-form]');
    form.addEventListener('submit',async e=>{e.preventDefault();const api=window.ISPApp.apiClient;if(!api?.isConfigured()){message('Backend API origin is not configured.','warning');return;}const data=Object.fromEntries(new FormData(form).entries());message('Signing in…');try{await api.login(data.username,data.password);form.elements.password.value='';message('Signed in.','success');await refresh();}catch(err){message(err.message||'Sign-in failed.','error');}});
    root.querySelector('[data-access-logout]').addEventListener('click',()=>{window.ISPApp.apiClient?.logout?.();message('Signed out.','success');showSession(null);});
    root.querySelector('[data-access-refresh]').addEventListener('click',refresh);
    function message(text,kind=''){const el=root.querySelector('[data-access-message]');el.textContent=text;const status=root.querySelector('[data-access-status]');status.textContent=kind==='success'?'Signed in':kind==='error'?'Sign-in error':kind==='warning'?'Not configured':'Session';status.className='status-pill '+kind;}
    function showSession(user){const box=root.querySelector('[data-access-session]');if(!user){box.textContent='No active session.';return;}box.innerHTML='<div class="device-row"><div><strong>'+esc(user.username)+'</strong><span>User ID: '+esc(user.id)+'</span></div><span class="badge">'+esc((user.roles||[]).join(', ')||'No roles')+'</span></div>';}
    async function refresh(){const api=window.ISPApp.apiClient;if(!api?.isConfigured()){message('Backend API origin is not configured.','warning');showSession(null);return;}try{const user=await api.me();showSession(user);message('Session verified.','success');}catch(e){showSession(null);message(e.status===401?'Sign in required.':(e.message||'Session check failed.'),e.status===401?'warning':'error');}}
    window.ISPApp.router?.apply?.();refresh();
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',render,{once:true});else render();
})();
