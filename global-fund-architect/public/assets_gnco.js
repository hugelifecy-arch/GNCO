(function () {
  function qs(sel, root) { return (root || document).querySelector(sel); }
  function qsa(sel, root) { return Array.from((root || document).querySelectorAll(sel)); }
  function norm(s) { return (s || "").toLowerCase().trim(); }

  function filter() {
    const q = norm(qs("#q")?.value);
    const status = qs("#status")?.value || "all";
    const rows = qsa("[data-jrow]");
    let visible = 0;

    rows.forEach((row) => {
      const hay = norm(row.getAttribute("data-hay"));
      const st = row.getAttribute("data-status");
      const okQ = !q || hay.includes(q);
      const okS = status === "all" || st === status;
      const show = okQ && okS;
      row.style.display = show ? "" : "none";
      if (show) visible++;
    });

    const out = qs("#count");
    if (out) out.textContent = `${visible}/${rows.length}`;
  }

  function exportVisibleJSON() {
    const rows = qsa("[data-jrow]").filter((r) => r.style.display !== "none");
    const payload = rows
      .map((r) => {
        try { return JSON.parse(r.getAttribute("data-json") || "null"); }
        catch { return null; }
      })
      .filter(Boolean);

    const blob = new Blob(
      [JSON.stringify({ exported_at: new Date().toISOString(), count: payload.length, jurisdictions: payload }, null, 2)],
      { type: "application/json" }
    );

    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = "gnco-visible-jurisdictions.json";
    document.body.appendChild(a);
    a.click();
    setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 250);
  }

  async function loadCoverage() {
    const tbody = qs("#rows");
    if (!tbody) return;

    const base = "/GNCO";
    const manifestUrl = `${base}/data/jurisdictions/manifest.json`;

    const manifest = await fetch(manifestUrl, { cache: "no-store" }).then((r) => r.json());
    const list = manifest.jurisdictions || [];

    const entries = [];
    for (const item of list) {
      const code = item.code;
      const url = `${base}/data/jurisdictions/${encodeURIComponent(code)}.json`;
      const data = await fetch(url, { cache: "no-store" }).then((r) => r.json());
      entries.push(data);
    }

    tbody.innerHTML = entries.map((j) => {
      const sources = (j.primary_sources || [])
        .map((s) => `<li><a href="${s.url}" target="_blank" rel="noopener noreferrer">${s.label}</a></li>`)
        .join("");

      const hay = [
        j.code, j.name, j.status, j.scope_notes,
        ...(j.regimes || []),
        ...(j.marketing_notes || []),
        ...(j.licensing_notes || []),
        ...(j.tokenization_notes || []),
        ...(j.crypto_financing_notes || []),
        ...(j.risk_flags || []),
        ...(j.primary_sources || []).map((s) => `${s.label} ${s.url}`)
      ].join(" • ");

      const pillClass =
        j.status === "Supported" ? "pill ok" :
        j.status === "Partial" ? "pill partial" :
        "pill planned";

      const jsonStr = JSON.stringify(j);

      return `
        <tr data-jrow
            data-hay="${String(hay).replace(/"/g, "&quot;")}"
            data-status="${j.status}"
            data-json="${String(jsonStr).replace(/"/g, "&quot;")}">
          <td class="code">${j.code}</td>
          <td>
            <b>${j.name}</b>
            <div class="small">Last verified: <span class="code">${j.last_verified}</span></div>
          </td>
          <td><span class="${pillClass}">${j.status}</span></td>
          <td><ul>${sources}</ul></td>
        </tr>
      `;
    }).join("");

    filter();
  }

  window.GNCO = window.GNCO || {};
  window.GNCO.coverage = { filter, exportVisibleJSON, loadCoverage };

  document.addEventListener("DOMContentLoaded", () => {
    const q = qs("#q");
    const s = qs("#status");
    const ex = qs("#export");
    if (q) q.addEventListener("input", filter);
    if (s) s.addEventListener("change", filter);
    if (ex) ex.addEventListener("click", exportVisibleJSON);

    loadCoverage().catch((e) => {
      console.error("Coverage load failed:", e);
      filter();
    });
  });
})();
