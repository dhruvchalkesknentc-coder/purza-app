'use strict';
// "Why Purza" tab: market facts (with sources) from /api/facts, and how Purza makes money.
(() => {
  const esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const GROUPS = [['buyers', 'Buyers already shop with AI and chat'], ['shops', 'Shops are invisible to AI'], ['payments', 'Paying is solved'], ['market', 'A big, growing repair market'], ['markets', 'The markets Purza starts in'], ['cars', 'Next: car parts']];
  async function load() {
    const box = document.getElementById('facts');
    if (!box) return;
    try {
      const [f, p] = await Promise.all([fetch('/api/facts').then(r => r.json()), fetch('/api/parts').then(r => r.json())]);
      box.innerHTML = GROUPS.map(([g, title]) => {
        const fs = f.facts.filter(x => x.group === g);
        if (!fs.length) return '';
        return '<h3 class="section-title">' + esc(title) + '</h3><div class="facts">' + fs.map(x => '<div class="card fact"><div class="stat">' + esc(x.stat) + '</div><div class="lbl">' + esc(x.label) + '</div><div class="small muted">' + esc(x.detail) + '</div><a class="src" href="' + esc(x.url) + '" target="_blank" rel="noopener">' + esc(x.source) + '</a></div>').join('') + '</div>';
      }).join('');
      const n = document.getElementById('obs-count');
      if (n) n.textContent = p.parts.reduce((s, x) => s + x.listings_count, 0);
    } catch (e) { box.innerHTML = '<p class="muted">Could not load the facts.</p>'; }
  }
  load();
})();
