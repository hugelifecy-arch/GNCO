(function(){
  function qs(sel, root){return (root||document).querySelector(sel)}
  function qsa(sel, root){return Array.from((root||document).querySelectorAll(sel))}
  function norm(s){return (s||"").toLowerCase().trim()}
  function filter(){
    const q = norm(qs('#q')?.value);
    const status = qs('#status')?.value || 'all';
    const rows = qsa('[data-jrow]');
    let visible = 0;
    rows.forEach(row=>{
      const hay = norm(row.getAttribute('data-hay'));
      const st = row.getAttribute('data-status');
      const okQ = !q || hay.includes(q);
      const okS = (status==='all') || (st===status);
      const show = okQ && okS;
      row.style.display = show ? '' : 'none';
      if(show) visible++;
    });
    const total = rows.length;
    const out = qs('#count');
    if(out) out.textContent = `${visible}/${total}`;
  }

  function exportJSON(){
    const rows = qsa('[data-jrow]').filter(r => r.style.display !== 'none');
    const payload = rows.map(r=>{
      try { return JSON.parse(r.getAttribute('data-json')); } catch(e){ return null; }
    }).filter(Boolean);
    const blob = new Blob([JSON.stringify({exported_at:new Date().toISOString(), count: payload.length, jurisdictions: payload}, null, 2)], {type:'application/json'});
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'gnco-coverage-export.json';
    document.body.appendChild(a);
    a.click();
    setTimeout(()=>{ URL.revokeObjectURL(a.href); a.remove(); }, 250);
  }

  window.GNCO = window.GNCO || {};
  window.GNCO.coverage = { filter, exportJSON };

  document.addEventListener('DOMContentLoaded', ()=>{
    const q = qs('#q'); const s = qs('#status');
    if(q) q.addEventListener('input', filter);
    if(s) s.addEventListener('change', filter);
    const ex = qs('#export');
    if(ex) ex.addEventListener('click', exportJSON);
    filter();
  });
})();
