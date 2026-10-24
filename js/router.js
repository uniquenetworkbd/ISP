window.ISPApp = window.ISPApp || {};
(function(){
  const titles={dashboard:'Command Center',topology:'Topology',map:'Network Map',devices:'Devices',alerts:'Alerts',analytics:'Analytics',reports:'Reports',system:'System'};
  function current(){return (location.hash||'#dashboard').slice(1).split('/')[0] || 'dashboard';}
  function apply(){const route=titles[current()]?current():'dashboard'; window.ISPApp.setState({route}); document.title=`ISP Monitoring — ${titles[route]}`; const title=document.getElementById('pageTitle'); if(title) title.textContent=titles[route]; document.querySelectorAll('[data-route]').forEach(el=>el.classList.toggle('active',el.dataset.route===route)); document.querySelectorAll('[data-view]').forEach(view=>{view.hidden=view.dataset.view!==route;}); window.dispatchEvent(new CustomEvent('isp:route',{detail:{route,title:titles[route]}}));}
  window.ISPApp.router={titles,current,go:(route)=>{location.hash=`#${route}`}};
  window.addEventListener('hashchange',apply); window.addEventListener('DOMContentLoaded',apply);
})();
