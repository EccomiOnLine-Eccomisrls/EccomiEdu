/* =========================================================
 * Eccomi Edu — Admin (caricamento materiali)
 * ========================================================= */

const $ = (s) => document.querySelector(s);

// ---- RIFERIMENTI UI
const apiBaseEl = $('#apiBase');
const userIdEl  = $('#userId');
const btnSave   = $('#btnSave');

const titleEl   = $('#title');
const typeEl    = $('#type');       // values: "link" | "text"
const urlEl     = $('#url');        // usato se type === "link"
const textEl    = $('#text');       // usato se type === "text"
const fileEl    = $('#file');       // se scegli un file, usiamo l'endpoint /upload/material

const btnAdd    = $('#btnAdd');

const btnReload = $('#btnReload');
const listEl    = $('#materialsList');

const btnDue    = $('#btnDue');
const dueEl     = $('#dueList');

const logEl     = $('#log');

// ---- UTILS
const log = (msg) => {
  const t = new Date().toTimeString().slice(0,8);
  logEl.textContent += `\n${t} ${msg}`;
  logEl.scrollTop = logEl.scrollHeight;
};

const readAPI = () => (apiBaseEl.value || '').trim().replace(/\/+$/,'');
const readUID = () => (userIdEl.value || '').trim();

const GET = async (path) => {
  const r = await fetch(`${readAPI()}${path}`);
  if (!r.ok) throw new Error(`${r.status} ${await r.text()}`);
  return r.json();
};
const POST = async (path, body) => {
  const r = await fetch(`${readAPI()}${path}`, {
    method: 'POST',
    headers: {'Content-Type':'application/json'},
    body: JSON.stringify(body)
  });
  if (!r.ok) throw new Error(await r.text());
  return r.json();
};

// ---- INIT: valori salvati localmente (opzionale)
(() => {
  // default consigliato
  if (!apiBaseEl.value) apiBaseEl.value = 'https://eccomi-edu-backend.onrender.com';
  log('Pronto.');
})();

// ---- Salva impostazioni
btnSave?.addEventListener('click', () => {
  // (le impostazioni sono lette direttamente dai campi; non serve salvare altrove)
  log('Impostazioni salvate.');
});

// ---- Aggiungi materiale
btnAdd?.addEventListener('click', async () => {
  try {
    const api = readAPI();
    const uid = readUID();
    const title = (titleEl.value || '').trim();
    const selType = typeEl.value;           // "link" | "text"
    const link = (urlEl.value || '').trim();
    const plain = (textEl.value || '').trim();
    const hasFile = fileEl.files && fileEl.files.length > 0;

    if (!api) throw new Error('API Base URL mancante.');
    if (!uid) throw new Error('User ID mancante.');
    if (!title) throw new Error('Titolo mancante.');

    // 1) Se c'è un file selezionato, usiamo /upload/material
    if (hasFile) {
      const fd = new FormData();
      fd.append('user_id', uid);
      fd.append('title', title);
      fd.append('file', fileEl.files[0]);
      const r = await fetch(`${api}/upload/material`, { method: 'POST', body: fd });
      if (!r.ok) throw new Error(await r.text());
      await r.json();
      log('File caricato.');
      fileEl.value = '';
      return;
    }

    // 2) Altrimenti usiamo /materials (link o testo)
    if (selType === 'link') {
      if (!link) throw new Error('URL mancante.');
      await POST('/materials', {
        user_id: uid,
        title,
        type: 'link',
        src_url: link             // <— NOME CORRETTO
      });
      log('Materiale (link) aggiunto.');
      urlEl.value = '';
    } else {
      if (!plain) throw new Error('Testo mancante.');
      await POST('/materials', {
        user_id: uid,
        title,
        type: 'text',
        plain_text: plain         // <— NOME CORRETTO (prima era "text")
      });
      log('Materiale (testo) aggiunto.');
      textEl.value = '';
    }
  } catch (err) {
    log(`Errore caricamento → ${err.message || err}`);
    alert(err.message || err);
  }
});

// ---- Ricarica lista materiali
btnReload?.addEventListener('click', async () => {
  try {
    listEl.innerHTML = 'Carico...';
    const data = await GET(`/materials?user_id=${encodeURIComponent(readUID())}`);
    if (!data || data.length === 0) {
      listEl.innerHTML = '<em>Nessun materiale.</em>';
      return;
    }
    listEl.innerHTML = data.map(m =>
      `<div class="mat">
        <div class="mat__title">${m.title}</div>
        <div class="mat__meta">#${m.id} • ${m.type}</div>
      </div>`).join('');
    log('Materiali ricaricati.');
  } catch (err) {
    listEl.innerHTML = '<em>Errore.</em>';
    log(`Errore ricarica → ${err.message || err}`);
  }
});

// ---- Ripasso di oggi
btnDue?.addEventListener('click', async () => {
  try {
    dueEl.innerHTML = 'Carico...';
    const data = await GET(`/repetition/today?user_id=${encodeURIComponent(readUID())}`);
    if (!data || data.length === 0) {
      dueEl.innerHTML = '<em>Nessuna card dovuta al momento.</em>';
      return;
    }
    dueEl.innerHTML = data.map(x => `<div class="due">• ${x.title}</div>`).join('');
  } catch (err) {
    dueEl.innerHTML = '<em>Errore.</em>';
    log(`Errore ripasso → ${err.message || err}`);
  }
});
