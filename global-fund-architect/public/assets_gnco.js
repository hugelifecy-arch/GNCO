(function () {
  const qs = (sel, root) => (root || document).querySelector(sel);
  const norm = (value) => String(value || '').toLowerCase().trim();

  const state = {
    rows: [],
    visible: []
  };

  const escapeHtml = (value) =>
    String(value)
      .replaceAll('&', '&amp;')
      .replaceAll('<', '&lt;')
      .replaceAll('>', '&gt;')
      .replaceAll('"', '&quot;')
      .replaceAll("'", '&#39;');

  const render = () => {
    const q = norm(qs('#q')?.value);
    const status = qs('#status')?.value || 'all';
    state.visible = state.rows.filter((item) => {
      const hay = norm(JSON.stringify(item));
      return (!q || hay.includes(q)) && (status === 'all' || item.status === status);
    });

    const tableBody = qs('#table-body');
    const cards = qs('#cards');
    const count = qs('#count');
    if (count) count.textContent = `${state.visible.length}/${state.rows.length}`;

    if (tableBody) {
      tableBody.innerHTML = state.visible
        .map((item) => {
          const sources = (item.primary_sources || [])
            .map(
              (s) =>
                `<li><a href="${escapeHtml(s.url)}" rel="noopener noreferrer" target="_blank">${escapeHtml(s.label || s.title || s.url)}</a></li>`
            )
            .join('');

          return `<tr>
            <td>${escapeHtml(item.code)}</td>
            <td><b>${escapeHtml(item.name)}</b><div class="small">Last verified: ${escapeHtml(item.last_verified)}</div></td>
            <td>${escapeHtml(item.status)}</td>
            <td><ul>${sources}</ul></td>
          </tr>`;
        })
        .join('');
    }

    if (cards) {
      cards.innerHTML = state.visible
        .map((item) => {
          const notes = (item.marketing_notes || []).map((n) => `<li>${escapeHtml(n)}</li>`).join('');
          const regimes = (item.regimes || []).map((r) => `<li>${escapeHtml(r)}</li>`).join('');

          return `<div class="card" style="margin-top:14px">
            <h2>${escapeHtml(item.code)} — ${escapeHtml(item.name)}</h2>
            <p>Status: <b>${escapeHtml(item.status)}</b> • Last verified: ${escapeHtml(item.last_verified)}</p>
            <h3>Regimes</h3>
            <ul>${regimes || '<li>None mapped yet.</li>'}</ul>
            <h3>Marketing notes</h3>
            <ul>${notes || '<li>No notes available.</li>'}</ul>
          </div>`;
        })
        .join('');
    }
  };

  const exportJSON = () => {
    const payload = {
      exported_at: new Date().toISOString(),
      count: state.visible.length,
      jurisdictions: state.visible
    };
    const blob = new Blob([JSON.stringify(payload, null, 2)], {
      type: 'application/json'
    });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'gnco-coverage-export.json';
    document.body.appendChild(a);
    a.click();
    setTimeout(() => {
      URL.revokeObjectURL(a.href);
      a.remove();
    }, 250);
  };

  const boot = async () => {
    const manifest = await fetch('./data/jurisdictions/manifest.json').then((r) => r.json());
    const ordered = manifest.jurisdictions || [];
    state.rows = await Promise.all(
      ordered.map((item) => fetch(`./data/jurisdictions/${item.code}.json`).then((r) => r.json()))
    );

    qs('#q')?.addEventListener('input', render);
    qs('#status')?.addEventListener('change', render);
    qs('#export')?.addEventListener('click', exportJSON);
    render();
  };

  document.addEventListener('DOMContentLoaded', () => {
    boot().catch((error) => {
      console.error('Failed to load coverage data', error);
    });
  });
})();
