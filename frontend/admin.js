/* =========================================================
 * Eccomi Edu — Admin Panel (coerente con admin.html)
 * ========================================================= */
import "./styles.css";

// ---------- Helpers ----------
const d = (id) => document.getElementById(id);
const logEl = d("log");
function log(msg) {
  logEl.textContent += `\n${new Date().toLocaleTimeString()} ${msg}`;
  logEl.scrollTop = logEl.scrollHeight;
}
function getApiBase() {
  return (d("apiBase").value || "").trim() || "https://eccomi-edu-backend.onrender.com";
}
function getUserId() {
  return (d("userId").value || "").trim() || "studente_001";
}

// ---------- Init impostazioni ----------
(function initSettings() {
  d("apiBase").value = localStorage.getItem("ec_api_base") || "https://eccomi-edu-backend.onrender.com";
  d("userId").value  = localStorage.getItem("ec_user_id")  || "studente_001";
  log("Impostazioni caricate.");
})();

d("saveBtn").addEventListener("click", () => {
  localStorage.setItem("ec_api_base", getApiBase());
  localStorage.setItem("ec_user_id", getUserId());
  log("Impostazioni salvate.");
});

// ---------- UI show/hide campi in base al tipo ----------
const tipoEl = d("tipo");
const boxLink = d("ifLink");
const boxText = d("ifText");
const boxFile = d("ifFile");

function refreshType() {
  const t = tipoEl.value;
  boxLink.style.display = t === "link" ? "block" : "none";
  boxText.style.display = t === "text" ? "block" : "none";
  boxFile.style.display = t === "file" ? "block" : "none";
}
tipoEl.addEventListener("change", refreshType);
refreshType();

// ---------- Submit materiale ----------
d("materialForm").addEventListener("submit", async (e) => {
  e.preventDefault();

  const apiBase = getApiBase();
  const userId  = getUserId();

  const title = (d("titolo").value || "").trim();
  const tipo  = tipoEl.value;               // 'link' | 'text' | 'file'
  const url   = (d("url").value || "").trim();
  const text  = (d("text").value || "").trim();
  const file  = d("file").files[0];

  try {
    let res;

    if (tipo === "file" && file) {
      // ✅ endpoint upload file (router: /upload/material)
      const fd = new FormData();
      fd.append("user_id", userId);
      fd.append("title", title || file.name);
      fd.append("file", file);

      res = await fetch(`${apiBase}/upload/material`, { method: "POST", body: fd });
    } else {
      // ✅ endpoint JSON (schema: user_id, title, content)
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
      throw new Error(`Errore caricamento → ${res.status} ${JSON.stringify(j)}`);
    }

    log("Materiale aggiunto.");
    await caricaMateriali();
  } catch (err) {
    log(err.message || "Errore");
  }
});

// ---------- Lista materiali ----------
async function caricaMateriali() {
  const apiBase = getApiBase();
  const userId  = getUserId();
  const listEl  = d("materials");

  listEl.innerHTML = "";
  try {
    const r = await fetch(`${apiBase}/materials?user_id=${encodeURIComponent(userId)}`);
    if (!r.ok) throw new Error("Errore caricamento lista");
    const items = await r.json();

    if (!items || !items.length) {
      listEl.innerHTML = `<p>Nessun materiale caricato.</p>`;
      return;
    }

    items.forEach((m) => {
      const div = document.createElement("div");
      div.className = "item";
      const small = (m.content || m.src_url || "").toString().slice(0, 120);
      div.innerHTML = `<b>${m.title || "(senza titolo)"}</b><br/><small>${small}</small>`;
      listEl.appendChild(div);
    });
  } catch (err) {
    log(err.message);
  }
}

d("reloadBtn").addEventListener("click", caricaMateriali);

// ---------- Altri bottoni (stub) ----------
d("quizBtn").addEventListener("click", () => log("Quiz: in arrivo 😉"));
d("logoutBtn").addEventListener("click", () => {
  localStorage.removeItem("ec_auth");
  location.href = "/";
});

// ---------- Avvio ----------
log("Pronto.");
