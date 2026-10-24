const menuButton=document.getElementById('menuButton');
const sidebar=document.getElementById('sidebar');
const toast=document.getElementById('toast');
menuButton?.addEventListener('click',()=>sidebar?.classList.toggle('open'));
document.querySelectorAll('.nav-item').forEach(link=>link.addEventListener('click',()=>sidebar?.classList.remove('open')));
document.getElementById('searchButton')?.addEventListener('click',()=>{
  toast.classList.add('show');
  toast.textContent='Global search is reserved for the Application Shell step.';
  setTimeout(()=>toast.classList.remove('show'),2200);
});
window.addEventListener('keydown',event=>{
  if(event.key==='/' && !['INPUT','TEXTAREA'].includes(document.activeElement.tagName)){
    event.preventDefault();
    document.getElementById('searchButton')?.focus();
  }
});
