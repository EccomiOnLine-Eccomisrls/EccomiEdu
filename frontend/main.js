/* =========================================================
 * Eccomi Edu — Frontend
 * main.js (login handler + redirect)
 * ========================================================= */

import './styles.css'; // Importa stili globali

// 🔹 URL BACKEND (Render)
const API_BASE = "https://eccomi-edu-backend.onrender.com";

// Footer anno corrente
document.querySelector('#year').textContent = new Date().getFullYear();

// Elementi DOM
const form = document.getElementById('loginForm');
const errEl = document.getElementById('err');

// Gestione login
form.addEventListener('submit', async (e) => {
  e.preventDefault();
  errEl.classList.add('hidden');

  // Prendo i dati dal form
  const data = Object.fromEntries(new FormData(form).entries());

  try {
    // Richiesta POST al backend
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

    // Login riuscito
    const j = await r.json();
    localStorage.setItem("ec_auth", JSON.stringify(j));
    location.href = "/admin.html"; // redirect
  } catch (err) {
    // Mostro errore
    errEl.textContent = err.message || "Errore di autenticazione";
    errEl.classList.remove("hidden");
  }
});
