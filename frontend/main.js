/* Eccomi Edu — main.js */
import './styles.css';

// 🔹 URL BACKEND
const API_BASE =
  (typeof window !== 'undefined' && window.VITE_API_BASE_URL) ||
  (import.meta?.env?.VITE_API_BASE_URL) ||
  "https://eccomi-edu-backend.onrender.com";

document.querySelector('#year').textContent = new Date().getFullYear();

const form = document.getElementById('loginForm');
const errEl = document.getElementById('err');

// Gestione login
form.addEventListener('submit', async (e) => {
  e.preventDefault();
  errEl.classList.add('hidden');

  const data = Object.fromEntries(new FormData(form).entries());

  try {
    const r = await fetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: data.email,
        password: data.password
      })
    });

    if (!r.ok) {
      const j = await r.json().catch(() => ({ detail: "Errore" }));
      throw new Error(j.detail || "Accesso negato");
    }

    const j = await r.json();
    localStorage.setItem("ec_auth", JSON.stringify(j));
    location.href = "/admin.html";
  } catch (err) {
    errEl.textContent = err.message || "Errore di autenticazione";
    errEl.classList.remove("hidden");
  }
});
