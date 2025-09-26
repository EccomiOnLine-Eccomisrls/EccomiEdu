/* Eccomi Edu — admin.js */
import './styles.css';

const API_BASE =
  (typeof window !== 'undefined' && window.VITE_API_BASE_URL) ||
  (import.meta?.env?.VITE_API_BASE_URL) ||
  "https://eccomi-edu-backend.onrender.com";

const log = (msg) => {
  const el = document.getElementById('log');
  el.textContent += `\n${new Date().toLocaleTimeString()} ${msg}`;
};

document.getElementById('logout').addEventListener('click', () => {
  localStorage.removeItem("ec_auth");
  location.href = "/index.html";
});

document.getElementById('save').addEventListener('click', () => {
  const apiBase = document.getElementById('apiBase').value.trim();
  const userId = document.getElementById('userId').value.trim();
  localStorage.setItem("ec_settings", JSON.stringify({ apiBase, userId }));
  log("Impostazioni salvate.");
});

// 🔹 Carica materiale
document.getElementById('add').addEventListener('click', async () => {
  const { apiBase, userId } = JSON.parse(localStorage.getItem("ec_settings") || "{}");
  if (!apiBase || !userId) {
    return log("Config mancante.");
  }

  const title = document.getElementById('title').value;
  const tipo = document.getElementById('tipo').value;
  const text = document.getElementById('text').value;
  const url = document.getElementById('url').value;

  try {
    const r = await fetch(`${apiBase}/materials`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title, tipo, text, url, userId })
    });

    if (!r.ok) throw new Error("Errore caricamento");
    log("Materiale aggiunto.");
  } catch (err) {
    log(err.message);
  }
});

// 🔹 Ricarica lista materiali
document.getElementById('reload').addEventListener('click', async () => {
  const { apiBase, userId } = JSON.parse(localStorage.getItem("ec_settings") || "{}");
  if (!apiBase || !userId) return log("Config mancante.");

  try {
    const r = await fetch(`${apiBase}/materials?userId=${userId}`);
    const j = await r.json();
    const list = document.getElementById('materials');
    list.innerHTML = j.map(m => `<li>${m.title}</li>`).join("");
    log("Lista aggiornata.");
  } catch (err) {
    log("Errore caricamento lista");
  }
});
