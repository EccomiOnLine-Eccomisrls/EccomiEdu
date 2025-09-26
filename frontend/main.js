import './styles.css';

const API_BASE =
  (typeof window !== 'undefined' && window.VITE_API_BASE_URL) ||
  (import.meta?.env?.VITE_API_BASE_URL) ||
  "https://eccomi-edu-backend.onrender.com";

document.querySelector('#year').textContent = new Date().getFullYear();

const form = document.getElementById('loginForm');
const errEl = document.getElementById('err');

form.addEventListener('submit', async (e) => {
  e.preventDefault();
  errEl.classList.add('hidden');

  const data = Object.fromEntries(new FormData(form).entries());

  try {
    const r = await fetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: data.email, password: data.password })
    });

    const text = await r.text();
    if (!r.ok) throw new Error(`Login ${r.status}: ${text || 'errore'}`);

    const j = JSON.parse(text);
    localStorage.setItem('ec_auth', JSON.stringify(j));

    // salvo anche API base per l’admin
    localStorage.setItem('ec_settings', JSON.stringify({
      apiBase: API_BASE,
      userId: 'studente_001'
    }));

    location.href = '/admin.html';
  } catch (err) {
    errEl.textContent = err.message || 'Errore di autenticazione';
    errEl.classList.remove('hidden');
  }
});
