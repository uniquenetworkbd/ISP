window.ISPApp = window.ISPApp || {};
(function(){
  const model = {
    version: '1.1',
    nodes: [
      {id:'core', type:'Core', name:'Core Router', detail:'Core-01', status:'Online', level:0, x:373, y:34, meta:'Core network'},
      {id:'sw', type:'Switch', name:'Distribution Switch', detail:'SW-Core-01', status:'Online', level:1, x:373, y:150, meta:'Distribution layer'},
      {id:'olt1', type:'OLT', name:'OLT North', detail:'OLT-N01', status:'Online', level:2, x:150, y:270, meta:'North / POP-01'},
      {id:'olt2', type:'OLT', name:'OLT Central', detail:'OLT-C01', status:'Online', level:2, x:373, y:270, meta:'Central / POP-02'},
      {id:'olt3', type:'OLT', name:'OLT South', detail:'OLT-S01', status:'Warning', level:2, x:596, y:270, meta:'South / POP-04'},
      {id:'onu1', type:'ONU', name:'ONU-001', detail:'Zone A / POP-01', status:'Online', level:3, x:48, y:430, meta:'PON endpoint'},
      {id:'onu2', type:'ONU', name:'ONU-024', detail:'Zone B / POP-02', status:'Online', level:3, x:245, y:430, meta:'PON endpoint'},
      {id:'onu3', type:'ONU', name:'ONU-118', detail:'Zone C / POP-04', status:'Online', level:3, x:442, y:430, meta:'PON endpoint'},
      {id:'customer', type:'Customer', name:'Customer Network', detail:'CPE / LAN', status:'Online', level:4, x:639, y:430, meta:'Customer edge'}
    ],
    edges: [
      {id:'edge-core-sw', source:'core', target:'sw', type:'uplink', status:'Online'},
      {id:'edge-sw-olt1', source:'sw', target:'olt1', type:'fiber', status:'Online'},
      {id:'edge-sw-olt2', source:'sw', target:'olt2', type:'fiber', status:'Online'},
      {id:'edge-sw-olt3', source:'sw', target:'olt3', type:'fiber', status:'Warning'},
      {id:'edge-olt1-onu1', source:'olt1', target:'onu1', type:'pon', status:'Online'},
      {id:'edge-olt2-onu2', source:'olt2', target:'onu2', type:'pon', status:'Online'},
      {id:'edge-olt3-onu3', source:'olt3', target:'onu3', type:'pon', status:'Online'},
      {id:'edge-onu3-customer', source:'onu3', target:'customer', type:'ethernet', status:'Online'}
    ]
  };

  const byId = id => model.nodes.find(n => n.id === id);
  const edgeBetween = (a,b) => model.edges.find(e => (e.source===a&&e.target===b)||(e.source===b&&e.target===a));
  const statusClass = status => status==='Warning' ? 'warning' : status==='Offline' ? 'danger' : 'success';
  const edgeClass = status => status==='Warning' ? 'topology-link-warning' : status==='Offline' ? 'topology-link-danger' : '';
  const pathFor = id => {
    const node = byId(id); if(!node) return '';
    const chain=[]; let current=id; const seen=new Set();
    while(current && !seen.has(current)){
      seen.add(current); const item=byId(current); if(!item) break; chain.unshift(item.name);
      const parent=model.edges.find(e=>e.target===current); current=parent ? parent.source : null;
    }
    const downstream=model.edges.find(e=>e.source===id);
    if(downstream){ const target=byId(downstream.target); if(target && !chain.includes(target.name)) chain.push(target.name); }
    return chain.join(' → ');
  };

  function injectControls(root){
    if(root.querySelector('.topology-view-controls')) return;
    const bar=document.createElement('div');
    bar.className='topology-view-controls';
    bar.innerHTML='<button type="button" data-topology-action="zoom-out" aria-label="Zoom out">−</button><button type="button" data-topology-action="zoom-reset" aria-label="Reset zoom">100%</button><button type="button" data-topology-action="zoom-in" aria-label="Zoom in">+</button><button type="button" data-topology-action="fit" aria-label="Fit topology">Fit</button>';
    const toolbar=root.querySelector('.topology-toolbar'); if(toolbar) toolbar.appendChild(bar);
    let scale=1;
    const stage=root.querySelector('.topology-stage');
    const setScale=value=>{scale=Math.min(1.35,Math.max(.72,value));if(stage){stage.style.transform=`scale(${scale})`;stage.style.transformOrigin='top left';}const reset=bar.querySelector('[data-topology-action="zoom-reset"]');if(reset)reset.textContent=`${Math.round(scale*100)}%`;};
    bar.addEventListener('click',e=>{const action=e.target.closest('[data-topology-action]')?.dataset.topologyAction;if(!action)return;if(action==='zoom-in')setScale(scale+.1);if(action==='zoom-out')setScale(scale-.1);if(action==='zoom-reset')setScale(1);if(action==='fit'){const canvas=root.querySelector('.topology-canvas');if(canvas&&stage){const width=Math.max(320,canvas.clientWidth-24);setScale(Math.min(1,width/900));canvas.scrollLeft=0;canvas.scrollTop=0;}}});
  }

  function render(root){
    const stage=root.querySelector('.topology-stage'); const svg=root.querySelector('.topology-links'); if(!stage||!svg)return;
    svg.innerHTML='';
    model.edges.forEach(edge=>{
      const source=byId(edge.source),target=byId(edge.target); if(!source||!target)return;
      const p=document.createElementNS('http://www.w3.org/2000/svg','path');
      p.classList.add('topology-link'); const extra=edgeClass(edge.status); if(extra)p.classList.add(extra);
      p.dataset.edge=edge.id; p.dataset.source=edge.source; p.dataset.target=edge.target; p.dataset.status=edge.status; p.dataset.type=edge.type;
      const x1=source.x+77,y1=source.y+40,x2=target.x+77,y2=target.y+40;
      p.setAttribute('d',`M${x1} ${y1} L${x2} ${y2}`); svg.appendChild(p);
    });
    model.nodes.forEach(node=>{
      let btn=stage.querySelector(`[data-node="${node.id}"]`);
      if(!btn){btn=document.createElement('button');btn.type='button';btn.className='topology-node';btn.dataset.node=node.id;stage.appendChild(btn);}
      btn.dataset.type=node.type;btn.style.left=`${node.x}px`;btn.style.top=`${node.y}px`;btn.innerHTML=`<span class="node-type">${node.type}</span><strong>${node.name}</strong><small>${node.detail}</small><span class="node-status"><i class="status-dot"></i>${node.status}</span>`;
      btn.classList.toggle('node-warning',node.status==='Warning'); btn.classList.toggle('node-danger',node.status==='Offline');
    });
  }

  function init(){
    const root=document.getElementById('topologyView'); if(!root)return;
    const detailName=root.querySelector('h3[data-detail="name"]'),detailType=root.querySelector('[data-detail="type"]'),detailStatus=root.querySelector('[data-detail="status"]'),detailPath=root.querySelector('[data-detail="path"]'),detailDevice=root.querySelector('dd[data-detail="name"]');
    render(root); injectControls(root);
    const select=key=>{
      const item=byId(key); if(!item)return;
      root.querySelectorAll('.topology-node').forEach(n=>n.classList.toggle('selected',n.dataset.node===key));
      if(detailName)detailName.textContent=item.name; if(detailDevice)detailDevice.textContent=item.detail; if(detailType)detailType.textContent=item.type;
      if(detailStatus){detailStatus.textContent=item.status;detailStatus.className=`badge ${statusClass(item.status)}`;}
      if(detailPath)detailPath.textContent=pathFor(key);
      const connected=new Set(model.edges.filter(e=>e.source===key||e.target===key).map(e=>e.id));
      root.querySelectorAll('.topology-link').forEach(l=>l.classList.toggle('active',connected.has(l.dataset.edge)));
    };
    root.querySelectorAll('.topology-node').forEach(btn=>btn.addEventListener('click',()=>select(btn.dataset.node)));
    root.querySelectorAll('.topology-filter').forEach(btn=>btn.addEventListener('click',()=>{
      root.querySelectorAll('.topology-filter').forEach(b=>{b.classList.remove('active');b.setAttribute('aria-pressed','false');});btn.classList.add('active');btn.setAttribute('aria-pressed','true');
      const filter=btn.dataset.filter;
      root.querySelectorAll('.topology-node').forEach(n=>n.hidden=filter!=='all'&&n.dataset.type!==filter);
      root.querySelectorAll('.topology-link').forEach(l=>{const a=byId(l.dataset.source),b=byId(l.dataset.target);l.hidden=filter!=='all'&&!(a?.type===filter||b?.type===filter);});
    }));
    root.querySelectorAll('.topology-filter').forEach(b=>b.setAttribute('aria-pressed',b.classList.contains('active')?'true':'false'));
    select('core');
    window.ISPApp.topologyModel=model;
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();
})();
