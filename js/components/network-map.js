window.ISPApp=window.ISPApp||{};
(function(){
  const nodes={
    core:{name:'Core Router',kind:'Core',device:'Core-01',status:'Online',zone:'Core',path:'Core → North / Central / South',summary:'Primary network aggregation point.'},
    zn:{name:'North Zone',kind:'Zone',device:'ZONE-N',status:'Online',zone:'North',path:'Core → North Zone → POPs',summary:'North service area.'},
    pn1:{name:'POP North-01',kind:'POP',device:'POP-N01',status:'Online',zone:'North',path:'North Zone → POP-N01 → OLT',summary:'North zone access point.'},
    pn2:{name:'POP North-02',kind:'POP',device:'POP-N02',status:'Online',zone:'North',path:'North Zone → POP-N02 → OLT',summary:'Secondary north access point.'},
    zc:{name:'Central Zone',kind:'Zone',device:'ZONE-C',status:'Online',zone:'Central',path:'Core → Central Zone → POPs',summary:'Central service area.'},
    pc1:{name:'POP Central-01',kind:'POP',device:'POP-C01',status:'Online',zone:'Central',path:'Central Zone → POP-C01 → OLT',summary:'Central primary access point.'},
    pc2:{name:'POP Central-02',kind:'POP',device:'POP-C02',status:'Warning',zone:'Central',path:'Central Zone → POP-C02 → OLT',summary:'Central access point with a warning state.'},
    zs:{name:'South Zone',kind:'Zone',device:'ZONE-S',status:'Online',zone:'South',path:'Core → South Zone → POP',summary:'South service area.'},
    ps1:{name:'POP South-01',kind:'POP',device:'POP-S01',status:'Online',zone:'South',path:'South Zone → POP-S01 → OLT',summary:'South primary access point.'}
  };
  const links={core:['zn','zc','zs'],zn:['pn1','pn2'],zc:['pc1','pc2'],zs:['ps1']};
  function init(){
    const root=document.getElementById('networkMapView'); if(!root)return;
    const setText=(key,value)=>{const el=root.querySelector(`[data-map-detail="${key}"]`);if(el)el.textContent=value;};
    const select=(key)=>{
      const item=nodes[key];if(!item)return;
      root.querySelectorAll('.map-node').forEach(n=>n.classList.toggle('selected',n.dataset.node===key));
      setText('name',item.name);setText('kind',item.kind);setText('device',item.device);setText('status',item.status);setText('zone',item.zone);setText('path',item.path);setText('summary',item.summary);
      root.querySelectorAll('.map-link').forEach(l=>l.classList.remove('active'));
      const connected=links[key]||[];connected.forEach(target=>{const link=root.querySelector(`[data-link="${key}-${target}"], [data-link="${target}-${key}"]`);if(link)link.classList.add('active');});
      Object.entries(links).forEach(([from,targets])=>targets.forEach(target=>{if(target===key){const link=root.querySelector(`[data-link="${from}-${target}"]`);if(link)link.classList.add('active');}}));
    };
    root.querySelectorAll('.map-node').forEach(btn=>btn.addEventListener('click',()=>select(btn.dataset.node)));
    root.querySelectorAll('.map-filter').forEach(btn=>btn.addEventListener('click',()=>{root.querySelectorAll('.map-filter').forEach(b=>b.classList.remove('active'));btn.classList.add('active');const filter=btn.dataset.filter;root.querySelectorAll('.map-node').forEach(n=>{n.hidden=filter!=='all'&&n.dataset.kind!==filter;});}));
    select('core');
  }
  window.addEventListener('DOMContentLoaded',init);
})();
