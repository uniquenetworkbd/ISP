window.ISPApp=window.ISPApp||{};
(function(){
  const model={version:'1.2',nodes:[
    {id:'core',type:'Core',name:'Core Router',detail:'Core-01',status:'Online',level:0,meta:{zone:'Core'}},
    {id:'sw',type:'Switch',name:'Distribution Switch',detail:'SW-Core-01',status:'Online',level:1,meta:{zone:'Core'}},
    {id:'olt1',type:'OLT',name:'OLT North',detail:'OLT-N01',status:'Online',level:2,meta:{zone:'North',mapRef:'pn1'}},
    {id:'olt2',type:'OLT',name:'OLT Central',detail:'OLT-C01',status:'Online',level:2,meta:{zone:'Central',mapRef:'pc1'}},
    {id:'olt3',type:'OLT',name:'OLT South',detail:'OLT-S01',status:'Warning',level:2,meta:{zone:'South',mapRef:'ps1'}},
    {id:'onu1',type:'ONU',name:'ONU-001',detail:'Zone A / POP-N01',status:'Online',level:3,meta:{zone:'North',mapRef:'pn1'}},
    {id:'onu2',type:'ONU',name:'ONU-024',detail:'Zone B / POP-C01',status:'Online',level:3,meta:{zone:'Central',mapRef:'pc1'}},
    {id:'onu3',type:'ONU',name:'ONU-118',detail:'Zone C / POP-S01',status:'Online',level:3,meta:{zone:'South',mapRef:'ps1'}},
    {id:'customer',type:'Customer',name:'Customer Network',detail:'CPE / LAN',status:'Online',level:4,meta:{zone:'South',mapRef:'ps1'}}
  ],edges:[
    {id:'edge-core-sw',source:'core',target:'sw',type:'uplink',status:'Online'},
    {id:'edge-sw-olt1',source:'sw',target:'olt1',type:'fiber',status:'Online'},
    {id:'edge-sw-olt2',source:'sw',target:'olt2',type:'fiber',status:'Online'},
    {id:'edge-sw-olt3',source:'sw',target:'olt3',type:'fiber',status:'Warning'},
    {id:'edge-olt1-onu1',source:'olt1',target:'onu1',type:'pon',status:'Online'},
    {id:'edge-olt2-onu2',source:'olt2',target:'onu2',type:'pon',status:'Online'},
    {id:'edge-olt3-onu3',source:'olt3',target:'onu3',type:'pon',status:'Online'},
    {id:'edge-onu3-customer',source:'onu3',target:'customer',type:'ethernet',status:'Online'}
  ]};

  const byId=id=>model.nodes.find(n=>n.id===id);
  const children=id=>model.edges.filter(e=>e.source===id).map(e=>e.target);
  const parents=id=>model.edges.filter(e=>e.target===id).map(e=>e.source);
  const statusClass=s=>s==='Warning'?'warning':s==='Offline'?'danger':'success';
  const edgeClass=s=>s==='Warning'?'topology-link-warning':s==='Offline'?'topology-link-danger':'';
  const state={selected:'core',filter:'all',scale:1,collapsed:new Set()};

  function layout(){
    const groups=new Map();
    model.nodes.forEach(n=>{if(!groups.has(n.level))groups.set(n.level,[]);groups.get(n.level).push(n)});
    const width=900,nodeW=154,gap=42;
    [...groups.entries()].forEach(([level,nodes])=>{
      const total=nodes.length*nodeW+(nodes.length-1)*gap;
      const start=Math.max(24,(width-total)/2);
      nodes.forEach((n,i)=>{n.x=Math.round(start+i*(nodeW+gap));n.y=28+level*116});
    });
    const stage=document.querySelector('#topologyView .topology-stage');
    if(stage){stage.style.width='900px';stage.style.height=`${Math.max(520,(Math.max(...model.nodes.map(n=>n.y))+130))}px`;}
  }

  function descendants(id,out=new Set()){
    children(id).forEach(child=>{if(!out.has(child)){out.add(child);descendants(child,out)}});return out;
  }
  function ancestors(id,out=new Set()){
    parents(id).forEach(parent=>{if(!out.has(parent)){out.add(parent);ancestors(parent,out)}});return out;
  }
  function pathEdges(id){
    const ids=new Set([id]);ancestors(id,ids);descendants(id,ids);
    return new Set(model.edges.filter(e=>ids.has(e.source)&&ids.has(e.target)).map(e=>e.id));
  }
  function pathText(id){
    const chain=[];let current=id;const seen=new Set();
    while(current&&!seen.has(current)){seen.add(current);chain.unshift(byId(current)?.name||current);current=parents(current)[0]||null;}
    const down=[];let cursor=id;const downSeen=new Set();
    while(cursor&&!downSeen.has(cursor)){downSeen.add(cursor);const next=children(cursor)[0];if(!next)break;down.push(byId(next)?.name||next);cursor=next;}
    return chain.concat(down).join(' → ');
  }

  function ensureActions(root){
    const panel=root.querySelector('.topology-details');if(!panel||panel.querySelector('.topology-detail-actions'))return;
    const actions=document.createElement('div');actions.className='topology-detail-actions';actions.innerHTML='<button type="button" data-topology-detail-action="map">Open Network Map</button><button type="button" data-topology-detail-action="collapse">Collapse branch</button>';
    panel.appendChild(actions);
    actions.addEventListener('click',e=>{const action=e.target.closest('button')?.dataset.topologyDetailAction;if(action==='map'){const item=byId(state.selected);if(item?.meta?.mapRef){window.dispatchEvent(new CustomEvent('isp:topology-map',{detail:{mapRef:item.meta.mapRef,zone:item.meta.zone,topologyId:item.id}}));location.hash='map';}}else if(action==='collapse'){toggleCollapse(state.selected);}});
  }

  function setScale(root,value){state.scale=Math.min(1.35,Math.max(.72,value));const stage=root.querySelector('.topology-stage');if(stage){stage.style.transform=`scale(${state.scale})`;stage.style.transformOrigin='top left';}const label=root.querySelector('[data-topology-action="zoom-reset"]');if(label)label.textContent=`${Math.round(state.scale*100)}%`;}
  function injectControls(root){
    if(root.querySelector('.topology-view-controls'))return;
    const bar=document.createElement('div');bar.className='topology-view-controls';bar.innerHTML='<button type="button" data-topology-action="zoom-out" aria-label="Zoom out">−</button><button type="button" data-topology-action="zoom-reset" aria-label="Reset zoom">100%</button><button type="button" data-topology-action="zoom-in" aria-label="Zoom in">+</button><button type="button" data-topology-action="fit" aria-label="Fit topology">Fit</button><button type="button" data-topology-action="expand" aria-label="Expand all branches">Expand</button>';
    root.querySelector('.topology-toolbar')?.appendChild(bar);
    bar.addEventListener('click',e=>{const a=e.target.closest('[data-topology-action]')?.dataset.topologyAction;if(!a)return;if(a==='zoom-in')setScale(root,state.scale+.1);if(a==='zoom-out')setScale(root,state.scale-.1);if(a==='zoom-reset')setScale(root,1);if(a==='expand'){state.collapsed.clear();render(root);select(root,state.selected)}if(a==='fit'){const c=root.querySelector('.topology-canvas');setScale(root,Math.min(1,Math.max(.72,(c?.clientWidth||900)-24)/900));if(c){c.scrollLeft=0;c.scrollTop=0}}});
  }

  function render(root){
    const stage=root.querySelector('.topology-stage'),svg=root.querySelector('.topology-links');if(!stage||!svg)return;
    layout();svg.innerHTML='';stage.querySelectorAll('.topology-node').forEach(n=>n.remove());
    const hidden=new Set();state.collapsed.forEach(id=>descendants(id).forEach(x=>hidden.add(x)));
    model.edges.forEach(e=>{if(hidden.has(e.source)||hidden.has(e.target))return;const a=byId(e.source),b=byId(e.target);const p=document.createElementNS('http://www.w3.org/2000/svg','path');p.classList.add('topology-link');const ec=edgeClass(e.status);if(ec)p.classList.add(ec);p.dataset.edge=e.id;p.dataset.source=e.source;p.dataset.target=e.target;p.setAttribute('d',`M${a.x+77} ${a.y+52} L${b.x+77} ${b.y+52}`);svg.appendChild(p)});
    model.nodes.forEach(n=>{if(hidden.has(n.id))return;const btn=document.createElement('button');btn.type='button';btn.className='topology-node';btn.dataset.node=n.id;btn.dataset.type=n.type;btn.style.left=`${n.x}px`;btn.style.top=`${n.y}px`;const hasChildren=children(n.id).length>0;const collapsed=state.collapsed.has(n.id);btn.innerHTML=`<span class="node-type">${n.type}</span><strong>${n.name}</strong><small>${n.detail}</small><span class="node-status"><i class="status-dot"></i>${n.status}</span>${hasChildren?`<span class="node-branch-toggle" aria-hidden="true">${collapsed?'＋':'−'}</span>`:''}`;btn.classList.toggle('node-warning',n.status==='Warning');btn.classList.toggle('node-danger',n.status==='Offline');stage.appendChild(btn);});
    applyFilter(root);ensureActions(root);
  }

  function applyFilter(root){
    root.querySelectorAll('.topology-node').forEach(n=>n.hidden=state.filter!=='all'&&n.dataset.type!==state.filter);
    root.querySelectorAll('.topology-link').forEach(l=>{const a=byId(l.dataset.source),b=byId(l.dataset.target);l.hidden=state.filter!=='all'&&!(a?.type===state.filter||b?.type===state.filter)});
  }
  function select(root,key){const item=byId(key);if(!item)return;state.selected=key;root.querySelectorAll('.topology-node').forEach(n=>n.classList.toggle('selected',n.dataset.node===key));const active=pathEdges(key);root.querySelectorAll('.topology-link').forEach(l=>l.classList.toggle('active',active.has(l.dataset.edge)));const set=(q,v)=>{const el=root.querySelector(q);if(el)el.textContent=v};set('[data-detail="name"]',item.name);set('dd[data-detail="name"]',item.detail);set('[data-detail="type"]',item.type);set('[data-detail="path"]',pathText(key));const badge=root.querySelector('[data-detail="status"]');if(badge){badge.textContent=item.status;badge.className=`badge ${statusClass(item.status)}`}const collapse=root.querySelector('[data-topology-detail-action="collapse"]');if(collapse)collapse.textContent=children(key).length?(state.collapsed.has(key)?'Expand branch':'Collapse branch'):'No child branch';if(collapse)collapse.disabled=!children(key).length;}
  function toggleCollapse(key){if(!children(key).length)return;if(state.collapsed.has(key))state.collapsed.delete(key);else state.collapsed.add(key);const root=document.getElementById('topologyView');render(root);select(root,key)}

  function showState(root,type,message){let el=root.querySelector('.topology-state');if(!el){el=document.createElement('div');el.className='topology-state';root.querySelector('.topology-workspace')?.prepend(el)}el.dataset.state=type;el.textContent=message;el.hidden=false;}
  function hideState(root){const el=root.querySelector('.topology-state');if(el)el.hidden=true;}

  function init(){const root=document.getElementById('topologyView');if(!root)return;try{if(!model.nodes.length||!model.edges.length){showState(root,'empty','No topology data available.');return}hideState(root);injectControls(root);render(root);root.querySelectorAll('.topology-node').forEach(btn=>btn.addEventListener('click',()=>select(root,btn.dataset.node)));root.querySelectorAll('.topology-filter').forEach(btn=>btn.addEventListener('click',()=>{root.querySelectorAll('.topology-filter').forEach(b=>{b.classList.remove('active');b.setAttribute('aria-pressed','false')});btn.classList.add('active');btn.setAttribute('aria-pressed','true');state.filter=btn.dataset.filter;applyFilter(root)}));select(root,'core');window.ISPApp.topologyModel=model;window.ISPApp.topologySelect=id=>select(root,id);window.ISPApp.topologyToggleCollapse=id=>toggleCollapse(id);window.addEventListener('isp:topology-select',e=>select(root,e.detail?.id));}catch(error){console.error(error);showState(root,'error','Topology could not be rendered. Check the frontend data model.')}}
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();
})();