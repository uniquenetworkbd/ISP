window.ISPApp = window.ISPApp || {};
window.ISPApp.state = { route: 'dashboard', sidebarCollapsed: false, sidebarOpen: false, activeOverlay: null, notificationsUnread: 3 };
window.ISPApp.setState = function(patch){ Object.assign(window.ISPApp.state, patch); window.dispatchEvent(new CustomEvent('isp:state', { detail: window.ISPApp.state })); };
