window.ISPApp = window.ISPApp || {};
(function(){
  const titles={dashboard:'Command Center',topology:'Topology',map:'Network Map',mikrotik:'MikroTik Dashboard',mikrotikServers:'MikroTik Servers',olt:'OLT / PON Dashboard',onu:'ONU Monitoring',interfaces:'Interface Monitoring',devices:'Devices',alerts:'Alert Center',analytics:'Analytics',reports:'Reports',system:'System'};
  function current(){return (location.hash||'#dashboard').slice(1).split('/')[0] || 'dashboard';}
  function apply(){
    const route=titles[current()]?current():'dashboard';
    if(typeof window.ISPApp.setState==='function')window.ISPApp.setState({route});
    document.title=`ISP Monitoring — ${titles[route]}`;
    const title=document.getElementById('pageTitle');
    if(title)title.textContent=titles[route];
    document.querySelectorAll('[data-route]').forEach(el=>el.classList.toggle('active',el.dataset.route===route));
    document.querySelectorAll('[data-view]').forEach(view=>{view.hidden=view.dataset.view!==route;});
    window.dispatchEvent(new CustomEvent('isp:route',{detail:{route,title:titles[route]}}));
  }
  function go(route){const target=titles[route]?route:'dashboard'; if(location.hash!==`#${target}`)location.hash=`#${target}`; else apply();}
  window.ISPApp.router={titles,current,apply,go};
  window.addEventListener('hashchange',apply);
  document.addEventListener('click',event=>{const link=event.target.closest?.('[data-route]');if(link&&titles[link.dataset.route]){if(location.hash!==`#${link.dataset.route}`){location.hash=`#${link.dataset.route}`;}else apply();}});
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',apply,{once:true});else apply();
})();
