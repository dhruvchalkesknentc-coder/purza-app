'use strict';
// Purza Copilot: the chat panel in the corner. It sends the chat to POST /api/agent and plays back the
// screen actions the agent asks for (switch tab, filter an area, open a live request) through window.PurzaUI.
(() => {
  const $ = id => document.getElementById(id);
  const esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const KEY = 'purza.copilot';
  const SUGGEST = [
    'Walk me through the demo, one step at a time',
    'Ask the market for an AC capacitor for a Voltas 1.5 T split AC in Kurla',
    'Show the judges the parts shops in Andheri',
    'What does a fan capacitor cost in Mumbai?',
    'How does Purza make money?',
    'What is real and what is demo on this site?'
  ];
  const TOOL_NAMES = { find_part: 'found the part', price_check: 'checked prices', shops_near: 'looked up shops', market_overview: 'read live numbers', ask_market: 'asked the market', get_offers: 'read the offers', reserve_offer: 'reserved', show_on_screen: 'changed the screen' };
  let msgs = load(), busy = false;

  function load() { try { const v = JSON.parse(sessionStorage.getItem(KEY)); return Array.isArray(v) ? v : []; } catch (e) { return []; } }
  function save() { try { sessionStorage.setItem(KEY, JSON.stringify(msgs.slice(-30))); } catch (e) { /* private mode */ } }
  // Requests the copilot posted in this chat, newest first, so it can read their offers later.
  function recentRequests() {
    const out = [];
    for (const m of msgs.slice().reverse()) for (const q of (m.reqs || [])) if (!out.some(o => o.id === q.id)) out.push(q);
    return out.slice(0, 5);
  }

  // A little markdown: paragraphs, bullet and numbered lists, **bold**. Everything is escaped first.
  function fmt(text) {
    let html = '', list = null;
    const close = () => { if (list) { html += '</' + list + '>'; list = null; } };
    for (const raw of esc(text).split('\n')) {
      const b = /^\s*[-*•]\s+(.*)$/.exec(raw), n = /^\s*\d+[.)]\s+(.*)$/.exec(raw);
      const kind = b ? 'ul' : n ? 'ol' : null;
      if (kind) { if (list !== kind) { close(); html += '<' + kind + '>'; list = kind; } html += '<li>' + (b || n)[1] + '</li>'; }
      else { close(); if (raw.trim()) html += '<p>' + raw + '</p>'; }
    }
    close();
    return html.replace(/\*\*(.+?)\*\*/g, '<b>$1</b>');
  }

  function render() {
    const log = $('cp-log');
    let h = '';
    if (!msgs.length) {
      h += '<div class="cp-msg bot"><p>Hi! I can run the demo with you: ask the market live, show shops in any Mumbai area, pull prices with sources, and answer the judges\' questions from the real data.</p></div>'
        + '<div class="cp-suggest">' + SUGGEST.map(s => '<button type="button" data-say="' + esc(s) + '">' + esc(s) + '</button>').join('') + '</div>';
    }
    for (const m of msgs) {
      h += '<div class="cp-msg ' + (m.role === 'user' ? 'user' : 'bot') + (m.error ? ' err' : '') + '">' + (m.role === 'user' ? '<p>' + esc(m.text).replace(/\n/g, '<br>') + '</p>' : fmt(m.text));
      if (m.used && m.used.length) h += '<div class="cp-used">' + [...new Set(m.used)].map(u => esc(TOOL_NAMES[u] || u)).join(' · ') + '</div>';
      h += '</div>';
    }
    if (busy) h += '<div class="cp-msg bot typing" aria-label="Copilot is thinking"><span></span><span></span><span></span></div>';
    log.innerHTML = h;
    log.scrollTop = log.scrollHeight;
    $('cp-send').disabled = busy;
  }

  function apply(actions) {
    const ui = window.PurzaUI;
    if (!ui || !Array.isArray(actions)) return;
    for (const a of actions) {
      try {
        if (a.type === 'open_request') ui.openRequest(a);
        else if (a.type === 'show') ui.show(a);
      } catch (e) { console.warn('Copilot action failed', e); }
    }
    // On a phone the panel covers the page: step aside so the audience sees what changed.
    if (actions.length && window.matchMedia('(max-width: 700px)').matches) setOpen(false);
  }

  async function send(text) {
    text = String(text || '').trim();
    if (!text || busy) return;
    msgs.push({ role: 'user', text });
    busy = true; render(); save();
    try {
      const view = (location.hash || '#find').slice(1);
      const r = await fetch('/api/agent', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ view, requests: recentRequests(), messages: msgs.filter(m => !m.error).map(m => ({ role: m.role, text: m.text })) })
      });
      const data = await r.json().catch(() => ({}));
      if (!r.ok) throw new Error(data.error || 'The copilot is not answering (' + r.status + ').');
      const reqs = (data.actions || []).filter(a => a.type === 'open_request' && a.id).map(a => ({ id: a.id, part_name: a.part_name }));
      msgs.push({ role: 'assistant', text: data.reply, used: data.tools_used || [], reqs });
      busy = false; render(); save();
      apply(data.actions || []);
    } catch (e) {
      msgs.push({ role: 'assistant', text: e.message || 'Something went wrong.', error: true });
      busy = false; render(); save();
    }
  }

  function setOpen(open) {
    $('cp-panel').hidden = !open;
    $('cp-fab').setAttribute('aria-expanded', String(open));
    $('cp-fab').classList.toggle('open', open);
    if (open) { render(); setTimeout(() => $('cp-input').focus(), 30); }
  }

  async function init() {
    if (!$('cp-fab')) return;
    try {
      const h = await fetch('/api/health').then(r => r.json());
      if (!h.copilot) return; // no AI key on the server: keep the copilot hidden
      $('cp-model').textContent = h.copilot === 'claude' ? 'Claude' : 'Gemini';
      $('cp-model').title = h.copilot_model || '';
    } catch (e) { return; }
    $('cp-fab').hidden = false;
    $('cp-fab').addEventListener('click', () => setOpen($('cp-panel').hidden));
    $('cp-close').addEventListener('click', () => { setOpen(false); $('cp-fab').focus(); });
    $('cp-new').addEventListener('click', () => { msgs = []; save(); render(); $('cp-input').focus(); });
    $('cp-form').addEventListener('submit', e => { e.preventDefault(); const t = $('cp-input').value; $('cp-input').value = ''; send(t); });
    $('cp-input').addEventListener('keydown', e => { if (e.key === 'Enter' && !e.shiftKey && !e.isComposing) { e.preventDefault(); $('cp-form').requestSubmit(); } });
    $('cp-log').addEventListener('click', e => { const b = e.target.closest('button[data-say]'); if (b) send(b.dataset.say); });
    document.addEventListener('keydown', e => { if (e.key === 'Escape' && !$('cp-panel').hidden) setOpen(false); });
    if (msgs.length) render();
  }
  init();
})();
