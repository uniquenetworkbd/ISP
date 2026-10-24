window.ISPApp = window.ISPApp || {};
(function(){
  const items=[
    ['dashboard','Command Center','Network overview'],
    ['topology','Topology','Core to customer topology'],
    ['map','Network Map','Zones and POPs'],
    ['mikrotik','MikroTik','Router fleet monitoring'],
    ['olt','OLT / PON','Optical access monitoring'],
    ['onu','ONU Monitoring','Subscriber endpoint health'],
    ['interfaces','Interfaces','Traffic and interface health'],
    ['alerts','Alerts','Active network alerts'],
    ['analytics','Analytics','Performance analytics'],
    ['reports','Reports','Report workspace'],
    ['devices','Devices','Device management'],
    ['system','System','System management']
  ];
  function init(){const overlay=document.getElementById('commandOverlay'),input=document.getElementById('commandInput'),results=document.getElementById('commandResults'); if(!overlay)return; let selected=0,filtered=items;
    function render(){results.innerHTML=filtered.map((x,i)=>`<button class="command-result ${i===selected?'active':''}" data-command-route="${x[0]}"><span>${i===selected?'›':'·'}</span><span><strong>${x[1]}</strong><small>${x[2]}</small></span></button>`).join('');results.querySelectorAll('[data-command-route]').forEach(b=>b.addEventListener('click',()=>{window.ISPApp.router.go(b.dataset.commandRoute);close();}));}
    function open(){overlay.hidden=false;input.value='';filtered=items;selected=0;render();setTimeout(()=>input.focus(),0);}
    function close(){overlay.hidden=true;}
    function filter(){const q=input.value.toLowerCase().trim();filtered=items.filter(x=>x.join(' ').toLowerCase().includes(q));selected=0;render();}
    document.getElementById('searchButton')?.addEventListener('click',open); document.addEventListener('keydown',e=>{if(e.key==='/'&&!['INPUT','TEXTAREA'].includes(document.activeElement.tagName)){e.preventDefault();open();}if(e.key==='Escape'&&!overlay.hidden)close();if(overlay.hidden)return;if(e.key==='ArrowDown'){e.preventDefault();selected=Math.min(selected+1,Math.max(filtered.length-1,0));render();}if(e.key==='ArrowUp'){e.preventDefault();selected=Math.max(selected-1,0);render();}if(e.key==='Enter'&&filtered[selected]){window.ISPApp.router.go(filtered[selected][0]);close();}}); input.addEventListener('input',filter);overlay.addEventListener('click',e=>{if(e.target===overlay)close();});
  }
  window.addEventListener('DOMContentLoaded',init);
})();
