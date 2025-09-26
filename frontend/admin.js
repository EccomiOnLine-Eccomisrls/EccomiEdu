/* =========================================================
 * Eccomi Edu — Admin Panel
 * Gestione materiali (link / testo / file)
 * ========================================================= */

import "./styles.css";

const apiBase = window.VITE_API_BASE_URL || "https://eccomi-edu-backend.onrender.com";

// Elementi DOM
const form = document.getElementById("materialForm");
const titoloEl = document.getElementById("titolo");
const tipoEl = document.getElementById("tipo");
const urlEl = document.getElementById("url");
const textEl = document.getElementById("text");
const fileEl = document.getElementById("file");
const userIdEl = document.getElementById("userId");
const logEl = document.getElementById("log");
const listaEl = document.getElementById("lista");

function log(msg) {
  logEl.textContent += `\n${new Date().toLocaleTimeString()} ${msg}`;
  logEl.scrollTop = logEl.scrollHeight;
}

// Salvataggio impostazioni
document.getElementById("saveBtn").addEventListener("click", () => {
  localStorage.setItem("ec_api_base", apiBase);
  localStorage.setItem("ec_user_id", userIdEl.value);
  log("Impostazioni salvate.");
});

// Caricamento materiali
form.addEventListener("submit", async (e) => {
  e.preventDefault();

  const title = titoloEl.value.trim();
  const tipo = tipoEl.value;
  const url = urlEl.value.trim();
  const text = textEl.value.trim();
  const file = fileEl.files[0];
  const userId = userIdEl.value || "studente_001";

  try {
    let res;
    if (tipo === "file" && file) {
      const fd = new FormData();
      fd.append("file", file);
      fd.append("user_id", userId);
      fd.append("title", title || file.name);
      res = await fetch(`${apiBase}/materials/upload`, { method: "POST", body: fd });
    } else {
      // ✅ Schema corretto per il backend
      const payload = {
        user_id: userId,
        title: title || (tipo === "link" ? url : (text.slice(0, 40) || "Senza titolo")),
        content: tipo === "link" ? url : text
      };
      res = await fetch(`${apiBase}/materials`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
    }

    if (!res.ok) {
      const j = await res.json().catch(() => ({}));
      throw new Error(`Errore caricamento: ${res.status} ${JSON.stringify(j)}`);
    }
    log("Materiale aggiunto.");
    await caricaMateriali();
  } catch (err) {
    log(err.message);
  }
});

// Lista materiali
async function caricaMateriali() {
  listaEl.innerHTML = "";
  try {
    const res = await fetch(`${apiBase}/materials?user_id=${userIdEl.value || "studente_001"}`);
    if (!res.ok) throw new Error("Errore caricamento lista");
    const j = await res.json();
    if (!j.length) {
      listaEl.innerHTML = "<p>Nessun materiale caricato.</p>";
      return;
    }
    j.forEach((m) => {
      const div = document.createElement("div");
      div.className = "item";
      div.innerHTML = `<b>${m.title}</b><br/><small>${m.content || ""}</small>`;
      listaEl.appendChild(div);
    });
  } catch (err) {
    log(err.message);
  }
}

// Bottone ricarica
document.getElementById("reloadBtn").addEventListener("click", caricaMateriali);

// Init
userIdEl.value = localStorage.getItem("ec_user_id") || "studente_001";
log("Pronto.");
