window.ISPApp=window.ISPApp||{};
(function(){
  function removeStaleTopologyMarkup(){
    // topology.js is loaded before app.js and owns the canonical rendered stage.
    // Never remove nodes/links after that renderer has initialized.
    if(window.ISPApp.topologyModel)return;
    const stage=document.querySelector('#topologyView .topology-stage');
    if(!stage)return;
    stage.querySelectorAll('.topology-links, .topology-node').forEach(el=>el.remove());
  }

  function normalizeInteractiveControls(){
    document.querySelectorAll('button:not([type])').forEach(button=>button.type='button');
    document.querySelectorAll('.icon-button').forEach(button=>{
      if(!button.getAttribute('aria-label'))button.setAttribute('aria-label',button.textContent.trim()||'Action');
    });
  }

  function markDemoData(){
    document.querySelectorAll('[data-demo-value]').forEach(el=>el.setAttribute('aria-label',`${el.textContent.trim()} (demonstration data)`));
  }

  function init(){
    removeStaleTopologyMarkup();
    normalizeInteractiveControls();
    markDemoData();
    window.ISPApp.frontendFinalized=true;
    window.dispatchEvent(new CustomEvent('isp:frontend-ready',{detail:{topologyMarkupClean:!window.ISPApp.topologyModel,controlsNormalized:true}}));
  }

  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();
})();
