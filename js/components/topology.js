window.ISPApp = window.ISPApp || {};
(function(){
  const nodes={
    core:{name:'Core Router',type:'Core',detail:'Core-01',status:'Online',path:'Core → Switch'},
    sw:{name:'Distribution Switch',type:'Switch',detail:'SW-Core-01',status:'Online',path:'Core → Switch → OLT'},
    olt1:{name:'OLT North',type:'OLT',detail:'OLT-N01',status:'Online',path:'Switch → OLT North → ONU'},
    olt2:{name:'OLT Central',type:'OLT',detail:'OLT-C01',status:'Online',path:'Switch → OLT Central → ONU'},
    olt3:{name:'OLT South',type:'OLT',detail:'OLT-S01',status:'Warning',path:'Switch → OLT South → ONU'},
    onu1:{name:'ONU-001',type:'ONU',detail:'Zone A / POP-01',status:'Online',path:'OLT North → ONU-001 → Customer'},
    onu2:{name:'ONU-024',type:'ONU',detail:'Zone B / POP-02',status:'Online',path:'OLT Central → ONU-024 → Customer'},
    onu3:{name:'ONU-118',type:'ONU',detail:'Zone C / POP-04',status:'Online',path:'OLT Central → ONU-118 → Customer'},
    customer:{name:'Customer Network',type:'Customer',detail:'CPE / LAN',status:'Online',path:'ONU-118 → Customer'}
  };
  const links={core:['core-sw'],sw:['core-sw','sw-olt1','sw-olt2','sw-olt3'],olt1:['sw-olt1','olt1-onu1','olt1-onu2'],olt2:['sw-olt2','olt2-onu2','olt2-onu3'],olt3:['sw-olt3'],onu1:['olt1-onu1'],onu2:['olt1-onu2','olt2-onu2'],onu3:['olt2-onu3','olt3-customer'],customer:['olt3-customer']};
  function init(){
    const root=document.getElementById('topologyView'); if(!root)return;
    const detailName=root.querySelector('[data-detail="name"]'),detailType=root.querySelector('[data-detail="type"]'),detailStatus=root.querySelector('[data-detail="status"]'),detailPath=root.querySelector('[data-detail="path"]');
    const statusClass=s=>s==='Warning'?'warning':s==='Offline'?'danger':'success';
    const select=(key)=>{const item=nodes[key];if(!item)return;root.querySelectorAll('.topology-node').forEach(n=>n.classList.toggle('selected',n.dataset.node===key));detailName.textContent=item.name;detailType.textContent=item.type;detailStatus.textContent=item.status;detailStatus.className=`badge ${statusClass(item.status)}`;detailPath.textContent=item.path;const active=new Set(links[key]||[]);root.querySelectorAll('.topology-link').forEach(l=>l.classList.toggle('active',active.has(l.dataset.link)));};
    root.querySelectorAll('.topology-node').forEach(btn=>btn.addEventListener('click',()=>select(btn.dataset.node)));
    root.querySelectorAll('.topology-filter').forEach(btn=>btn.addEventListener('click',()=>{root.querySelectorAll('.topology-filter').forEach(b=>b.classList.remove('active'));btn.classList.add('active');const filter=btn.dataset.filter;root.querySelectorAll('.topology-node').forEach(n=>{n.hidden=filter!=='all'&&n.dataset.type!==filter;});root.querySelectorAll('.topology-link').forEach(l=>{if(filter==='all'){l.hidden=false;return}const parts=l.dataset.link.split('-');const a=parts[0],b=parts.slice(1).join('-');const na=nodes[a],nb=nodes[b];l.hidden=!(na&&nb&&(na.type===filter||nb.type===filter));});}));
    select('core');
  }
  window.addEventListener('DOMContentLoaded',init);
})();