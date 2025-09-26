const $ = (s, r=document)=>r.querySelector(s);

// Auth gate
const auth = JSON.parse(localStorage.getItem('ec_auth') || 'null');
if (!auth?.access_token) { window.location.href = '/'; }

// API base & token
const API_BASE = localStorage.getItem('ec_api') || 'https://eccomi-edu-backend.onrender.com';
const TOKEN = auth.access_token;

// UI init
$('#apiBase').value = API_BASE;
$('#userId').value = localStorage.getItem('ec_user') || 'studente_001';
$('#userInfo').textContent = `${auth.user?.name || auth.user?.email || 'Utente'} — ${auth.user?.role || ''}`;

$('#btnLogout').onclick = () => { localStorage.removeItem('ec_auth'); window.location.href = '/'; };
$('#btnSaveCfg').onclick = ()=>{ localStorage.setItem('ec_api', $('#apiBase').value.trim()); localStorage.setItem('ec_user', $('#userId').value.trim()); log('Impostazioni salvate.'); };

function log(msg){
  const el = $('#log'); const time = new Date().toLocaleTimeString();
  el.textContent = `[${time}] ${msg}\n` + el.textContent;
}

async function apiFetch(path, opts={}){
  const base = localStorage.getItem('ec_api') || API_BASE;
  opts.headers = opts.headers || {};
  if (!(opts.body instanceof FormData)) { opts.headers['Content-Type'] = opts.headers['Content-Type'] || 'application/json'; }
  if (TOKEN) opts.headers['Authorization'] = `Bearer ${TOKEN}`;
  const res = await fetch(`${base}${path}`, opts);
  if (!res.ok){ throw new Error(await res.text()); }
  const ct = res.headers.get('content-type') || '';
  return ct.includes('application/json') ? res.json() : res.text();
}

// Aggiungi materiale
$('#btnAdd').onclick = async ()=>{
  try{
    const user_id = $('#userId').value.trim();
    const title   = $('#matTitle').value.trim();
    const type    = $('#matType').value;
    const useUpload = $('#useUpload').checked;
    const src_url = $('#matUrl').value.trim() || null;
    const plain_text = $('#matText').value.trim() || null;
    if (!user_id || !title){ alert('User ID e Titolo obbligatori'); return; }

    if (useUpload){
      const f = $('#matFile').files[0];
      if (!f){ alert('Seleziona un file'); return; }
      const fd = new FormData();
      fd.append('user_id', user_id);
      fd.append('title', title);
      fd.append('file', f);
      const out = await apiFetch('/upload/material', { method:'POST', body: fd });
      log(`File caricato: ${out.id} (${out.filename})`); alert('Caricato ✔');
    } else {
      if (!src_url && !plain_text){ alert('Inserisci URL o Testo'); return; }
      const out = await apiFetch('/materials', {
        method:'POST', body: JSON.stringify({ user_id, title, type, src_url, plain_text })
      });
      log(`Materiale creato: ${out.id}`); alert('Creato ✔');
    }
  }catch(err){ console.error(err); alert(err.message); log(err.message); }
};

// Ricarica materiali
$('#btnReload').onclick = async ()=>{
  try{
    const user_id = $('#userId').value.trim();
    const list = await apiFetch(`/materials?user_id=${encodeURIComponent(user_id)}`);
    if (!Array.isArray(list) || list.length===0){ $('#materialsList').innerHTML = '<i>Nessun materiale trovato.</i>'; return; }
    $('#materialsList').innerHTML = list.map(m => `
      <div class="row">
        <div><b>${escapeHtml(m.title)}</b> <span class="pill">${escapeHtml(m.type||'')}</span></div>
        <div class="actions">
          <button class="btn sm" onclick="doSumm('${m.id}')">Sintesi</button>
          <button class="btn sm" onclick="doCornell('${m.id}')">Cornell</button>
          <button class="btn sm" onclick="doFlash('${m.id}')">Flashcard</button>
          <button class="btn sm" onclick="doQuiz('${m.id}')">Quiz</button>
        </div>
      </div>
    `).join('');
    log(`Materiali: ${list.length}`);
  }catch(err){ console.error(err); alert(err.message); log(err.message); }
};

// Artifacts list
$('#btnShowArtifacts').onclick = async ()=>{
  try{
    const user_id = $('#userId').value.trim();
    const arts = await apiFetch(`/ai/artifacts/${encodeURIComponent(user_id)}`);
    alert(`${arts.length} artifact trovati (vedi console)`); console.log('Artifacts:', arts);
  }catch(err){ console.error(err); alert(err.message); log(err.message); }
};

function escapeHtml(x){ return String(x??'').replace(/[&<>\"']/g, m=>({ '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;', "'":'&#39;' }[m])); }

window.doSumm = async (mid)=>{
  try{
    const user_id = $('#userId').value.trim();
    const m = await apiFetch(`/materials/${mid}`);
    const text = m.ocr_text || m.plain_text || 'Testo non presente, usa link.';
    const a = await apiFetch('/ai/summarize', { method:'POST', body: JSON.stringify({ user_id, material_id: mid, text }) });
    alert('Sintesi pronta ✔'); log(`Sintesi: ${a.id}`);
  }catch(err){ console.error(err); alert(err.message); log(err.message); }
};

window.doCornell = async (mid)=>{
  try{
    const user_id = $('#userId').value.trim();
    const m = await apiFetch(`/materials/${mid}`);
    const text = m.ocr_text || m.plain_text || 'Testo non presente';
    const a = await apiFetch('/ai/cornell', { method:'POST', body: JSON.stringify({ user_id, material_id: mid, text }) });
    alert('Cornell pronto ✔'); log(`Cornell: ${a.id}`);
  }catch(err){ console.error(err); alert(err.message); log(err.message); }
};

window.doFlash = async (mid)=>{
  try{
    const user_id = $('#userId').value.trim();
    const m = await apiFetch(`/materials/${mid}`);
    const text = m.ocr_text || m.plain_text || 'Testo non presente';
    const a = await apiFetch('/ai/flashcards', { method:'POST', body: JSON.stringify({ user_id, material_id: mid, text, n: 20 }) });
    await apiFetch('/repetition/seed', { method:'POST', body: JSON.stringify({ user_id, artifact_id: a.id }) });
    alert('Flashcard create + seed ✔'); log(`Flashcards: ${a.id}`);
  }catch(err){ console.error(err); alert(err.message); log(err.message); }
};

window.doQuiz = async (mid)=>{
  try{
    const user_id = $('#userId').value.trim();
    const m = await apiFetch(`/materials/${mid}`);
    const text = m.ocr_text || m.plain_text || 'Testo non presente';
    const a = await apiFetch('/ai/quiz', { method:'POST', body: JSON.stringify({ user_id, material_id: mid, text, n: 8 }) });
    alert('Quiz generato ✔'); log(`Quiz: ${a.id}`);
  }catch(err){ console.error(err); alert(err.message); log(err.message); }
};

// Ripasso
$('#btnDue').onclick = async ()=>{
  try{
    const user_id = $('#userId').value.trim();
    const {cards} = await apiFetch(`/repetition/today?user_id=${encodeURIComponent(user_id)}`);
    $('#dueList').innerHTML = (cards||[]).map(c => `
      <div class="row" style="align-items:flex-start;">
        <div style="flex:1 1 auto;">
          <div><b>Q:</b> ${escapeHtml(c.q)}</div>
          <details><summary>Mostra risposta</summary><div><b>A:</b> ${escapeHtml(c.a)}</div></details>
        </div>
        <div class="actions">
          ${[0,1,2,3,4,5].map(g=>`<button class="btn sm" onclick="gradeCard('${c.id}',${g})">${g}</button>`).join('')}
        </div>
      </div>
    `).join('') || '<i>Nessuna card dovuta oggi</i>';
    log(`Cards dovute: ${(cards||[]).length}`);
  }catch(err){ console.error(err); alert(err.message); log(err.message); }
};

window.gradeCard = async (cid, g)=>{
  try{
    const user_id = $('#userId').value.trim();
    await apiFetch('/repetition/review', { method:'POST', body: JSON.stringify({ user_id, card_id: cid, grade: g }) });
    log(`Voto ${g} registrato`);
  }catch(err){ console.error(err); alert(err.message); log(err.message); }
};
