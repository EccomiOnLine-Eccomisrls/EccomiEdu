import './styles.css';

const API_BASE =
  (typeof window !== 'undefined' && window.VITE_API_BASE_URL) ||
  (import.meta?.env?.VITE_API_BASE_URL) ||
  "https://eccomi-edu-backend.onrender.com";

const $ = (s) => document.querySelector(s);
const log = (m) => { const el = $('#log'); el.textContent += `\n${new Date().toLocaleTimeString()} ${m}`; el.scrollTop = el.scrollHeight; };

// bootstrap UI con valori salvati
(function init() {
  const s = JSON.parse(localStorage.getItem('ec_settings') || '{}');
  $('#apiBase').value = s.apiBase || API_BASE;
  $('#userId').value  = s.userId  || 'studente_001';
})();

$('#logout').addEventListener('click', () => {
  localStorage.removeItem('ec_auth');
  location.href = '/index.html';
});

$('#save').addEventListener('click', () => {
  const apiBase = $('#apiBase').value.trim();
  const userId  = $('#userId').value.trim();
  localStorage.setItem('ec_settings', JSON.stringify({ apiBase, userId }));
  log('Impostazioni salvate.');
});

// POST materiale
$('#add').addEventListener('click', async () => {
  const { apiBase, userId } = JSON.parse(localStorage.getItem('ec_settings') || '{}');
  if (!apiBase || !userId) return log('Config mancante.');

  const title = $('#title').value.trim();
  const tipo  = $('#tipo').value;
  const text  = $('#text').value.trim();
  const url   = $('#url').value.trim();
  const file  = $('#file').files[0];

  try {
    let res;
    if (tipo === 'file') {
      if (!file) return log('Seleziona un file.');
      const fd = new FormData();
      fd.append('user_id', userId);
      fd.append('title', title || file.name);
      fd.append('category', '');
      fd.append('file', file);
      res = await fetch(`${apiBase}/upload/material`, { method: 'POST', body: fd });
    } else {
      // mappo sui nomi attesi dal backend
      const payload = {
        user_id: userId,
        title: title || (tipo === 'link' ? url : (text.slice(0,40) || 'Senza titolo')),
        type: tipo,              // "link" | "text"
        src_url: tipo === 'link' ? url : null,
        text:    tipo === 'text' ? text : null
      };
      res = await fetch(`${apiBase}/materials`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
    }

    const bodyText = await res.text();
    if (!res.ok) throw new Error(`POST ${res.status}: ${bodyText}`);
    log('Materiale aggiunto.');
  } catch (e) {
    log(`Errore caricamento → ${e.message}`);
  }
});

// GET lista materiali
$('#reload').addEventListener('click', async () => {
  const { apiBase, userId } = JSON.parse(localStorage.getItem('ec_settings') || '{}');
  if (!apiBase || !userId) return log('Config mancante.');

  try {
    const res = await fetch(`${apiBase}/materials?user_id=${encodeURIComponent(userId)}`);
    const text = await res.text();
    if (!res.ok) throw new Error(`GET ${res.status}: ${text}`);

    const items = JSON.parse(text);
    const list = $('#materials');
    list.innerHTML = items.length
      ? items.map(m => `<li><strong>${m.title}</strong> <em>(${m.type})</em></li>`).join('')
      : '<li>Nessun materiale caricato.</li>';

    log('Lista aggiornata.');
  } catch (e) {
    log(`Errore lista → ${e.message}`);
  }
});
