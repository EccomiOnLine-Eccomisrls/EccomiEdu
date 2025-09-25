// Guard semplice lato client
const API_BASE = (import.meta.env.VITE_API_BASE_URL) || "https://eccomi-edu-backend.onrender.com";
const authRaw = localStorage.getItem('ec_auth');
if(!authRaw){
  location.href = '/';
}
const auth = JSON.parse(authRaw || '{}');
const token = auth?.access_token;
if(!token){ location.href='/'; }

document.getElementById('userBadge').textContent = `${auth.user?.name || 'Utente'} • ${auth.user?.role || ''} • ${auth.user?.plan || ''}`;
document.getElementById('logoutBtn').addEventListener('click', ()=>{
  localStorage.removeItem('ec_auth'); location.href='/';
});

// /me
(async ()=>{
  try{
    const r = await fetch(`${API_BASE}/me`, { headers:{ Authorization:`Bearer ${token}` }});
    if(!r.ok) throw new Error('Sessione scaduta');
    const me = await r.json();
    document.getElementById('planBadge').textContent = `Piano attuale: ${me.plan}`;
  }catch(e){
    localStorage.removeItem('ec_auth'); location.href='/';
  }
})();

// Tabs
const tabs = Array.from(document.querySelectorAll('.tab'));
const panes = Array.from(document.querySelectorAll('.tabpane'));
tabs.forEach(btn=>{
  btn.addEventListener('click', ()=>{
    tabs.forEach(b=>b.classList.remove('active'));
    btn.classList.add('active');
    const name = btn.dataset.tab;
    panes.forEach(p=>p.classList.toggle('show', p.id === `tab-${name}`));
  });
});

// Upload
const upForm = document.getElementById('upForm');
const upMsg = document.getElementById('upMsg');
const lastUpload = document.getElementById('lastUpload');
const fileInfo = document.getElementById('fileInfo');
const summBtn = document.getElementById('summBtn');
const summaryBox = document.getElementById('summaryBox');
let lastMaterialId = null;

upForm?.addEventListener('submit', async (e)=>{
  e.preventDefault();
  upMsg.textContent = '';
  summaryBox.textContent = '';
  const f = new FormData(upForm);
  try{
    const r = await fetch(`${API_BASE}/materials/upload`, {
      method:'POST',
      headers:{ Authorization:`Bearer ${token}` },
      body: f
    });
    if(!r.ok){ throw new Error('Upload fallito'); }
    const j = await r.json();
    lastMaterialId = j.id;
    fileInfo.textContent = `${j.filename} • ${(j.size/1024).toFixed(1)} KB • ${j.mime}`;
    lastUpload.style.display = 'block';
    upMsg.textContent = 'File caricato ✅';
  }catch(err){
    upMsg.textContent = err.message || 'Errore di upload';
  }
});

summBtn?.addEventListener('click', async ()=>{
  if(!lastMaterialId){ return; }
  summaryBox.textContent = 'Genero riassunto…';
  try{
    const r = await fetch(`${API_BASE}/materials/${lastMaterialId}/summary`, {
      method:'POST',
      headers:{ 'Content-Type':'application/json', Authorization:`Bearer ${token}` }
    });
    if(!r.ok){ throw new Error('Errore riassunto'); }
    const j = await r.json();
    summaryBox.textContent = j.summary || '(vuoto)';
  }catch(err){
    summaryBox.textContent = err.message || 'Errore';
  }
});
