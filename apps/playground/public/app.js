const TENANT_ID = "tenant-a";
const PROJECT_ID = "project-1";

const headers = {
  "x-tenant-id": TENANT_ID,
  "x-project-id": PROJECT_ID,
  "content-type": "application/json",
};

const $ = (id) => document.getElementById(id);

function showDebug(data) {
  $("debug-output").textContent = JSON.stringify(data, null, 2);
}

async function api(path, options = {}) {
  const res = await fetch(path, {
    ...options,
    headers: { ...headers, ...options.headers },
  });
  const text = await res.text();
  let body;
  try {
    body = text ? JSON.parse(text) : null;
  } catch {
    body = text;
  }
  const result = { status: res.status, body };
  showDebug(result);
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return body;
}

async function checkHealth() {
  const pill = $("health-pill");
  try {
    const res = await fetch("/health");
    const body = await res.json();
    if (body.ok) {
      pill.textContent = "ok";
      pill.className = "pill ok";
    } else {
      pill.textContent = "error";
      pill.className = "pill err";
    }
    showDebug({ status: res.status, body });
  } catch {
    pill.textContent = "offline";
    pill.className = "pill err";
  }
}

function defaultDateTimeLocal() {
  const now = new Date();
  now.setMinutes(now.getMinutes() - now.getTimezoneOffset());
  return now.toISOString().slice(0, 16);
}

function renderKeywords(keywords) {
  const tbody = $("keywords-body");
  const select = $("snapshot-keyword");
  tbody.innerHTML = "";
  select.innerHTML = "";

  if (keywords.length === 0) {
    tbody.innerHTML = `<tr class="empty"><td colspan="4">No keywords yet — add one above.</td></tr>`;
  }

  for (const kw of keywords) {
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td><strong>${escapeHtml(kw.text)}</strong></td>
      <td><span class="tag">${escapeHtml(kw.country)}</span></td>
      <td><span class="tag">${escapeHtml(kw.device)}</span></td>
      <td style="text-align: right"><button type="button" class="danger" data-delete="${kw.id}">Delete</button></td>
    `;
    tbody.appendChild(tr);

    const opt = document.createElement("option");
    opt.value = kw.id;
    opt.textContent = kw.text;
    select.appendChild(opt);
  }

  tbody.querySelectorAll("[data-delete]").forEach((btn) => {
    btn.addEventListener("click", async () => {
      await api(`/keywords/${btn.dataset.delete}`, { method: "DELETE" });
      await loadKeywords();
    });
  });
}

function renderSnapshots(snapshots) {
  const tbody = $("snapshots-body");
  tbody.innerHTML = "";

  if (snapshots.length === 0) {
    tbody.innerHTML = `<tr class="empty"><td colspan="4">No snapshots — log one or click "Load history".</td></tr>`;
    return;
  }

  for (const s of snapshots) {
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${escapeHtml(new Date(s.capturedAt).toLocaleString())}</td>
      <td><span class="badge">${s.position ?? "—"}</span></td>
      <td class="url-cell">${escapeHtml(s.url ?? "—")}</td>
      <td><span class="tag">${escapeHtml(s.source)}</span></td>
    `;
    tbody.appendChild(tr);
  }
}

function escapeHtml(str) {
  return String(str)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

async function loadKeywords() {
  const result = await api("/keywords");
  renderKeywords(result.data ?? []);
}

async function addKeyword() {
  const text = $("keyword-text").value.trim();
  if (!text) return;
  await api("/keywords", {
    method: "POST",
    body: JSON.stringify({
      text,
      country: $("keyword-country").value.trim() || "us",
      device: $("keyword-device").value,
      tags: [],
    }),
  });
  $("keyword-text").value = "";
  await loadKeywords();
}

async function logSnapshot() {
  const keywordId = $("snapshot-keyword").value;
  if (!keywordId) {
    showDebug({ error: "Add a keyword first" });
    return;
  }
  const capturedAt = new Date($("snapshot-date").value).toISOString();
  await api("/snapshots", {
    method: "POST",
    body: JSON.stringify({
      keywordId,
      position: Number($("snapshot-position").value),
      url: $("snapshot-url").value,
      source: "manual",
      device: "desktop",
      country: "us",
      capturedAt,
    }),
  });
  await loadSnapshots();
}

async function loadSnapshots() {
  const keywordId = $("snapshot-keyword").value;
  if (!keywordId) {
    renderSnapshots([]);
    return;
  }
  const from = new Date();
  from.setFullYear(from.getFullYear() - 1);
  const to = new Date();
  to.setDate(to.getDate() + 1);
  const qs = new URLSearchParams({
    keywordId,
    from: from.toISOString(),
    to: to.toISOString(),
  });
  const result = await api(`/snapshots?${qs}`);
  renderSnapshots(result.data ?? []);
}

$("add-keyword").addEventListener("click", () => void addKeyword());
$("refresh-keywords").addEventListener("click", () => void loadKeywords());
$("log-snapshot").addEventListener("click", () => void logSnapshot());
$("load-snapshots").addEventListener("click", () => void loadSnapshots());

$("snapshot-date").value = defaultDateTimeLocal();

renderSnapshots([]);
void checkHealth();
void loadKeywords();
