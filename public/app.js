'use strict';
// Purza web app: talks to the REST API in src/server.js. No build step, no framework.
(() => {
const $ = id => document.getElementById(id);
const esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const inr = n => '₹' + Math.round(Number(n) || 0).toLocaleString('en-IN');
const VIEWS = ['find', 'shop', 'prices', 'markets', 'agents', 'cars', 'why'];
const PREFER = { genuine: 'wants genuine', cheap: 'wants cheapest', fast: 'wants it fast' };
const CAT_SHORT = { ac: 'AC', fan: 'FAN', mixer: 'MIX', washer: 'WM', geyser: 'GYS', fridge: 'FRG', general: 'PART' };
let MARKETS = ['Lohar Chawl', 'Lamington Road', 'Grant Road', 'Other Mumbai']; // replaced by the Mumbai areas from /api/listings

const mem = {};
const store = {
  get(k, d) { try { const v = localStorage.getItem(k); return v ? JSON.parse(v) : d; } catch (e) { return k in mem ? mem[k] : d; } },
  set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) { mem[k] = v; } }
};
async function api(method, path, body, token) {
  const headers = {};
  if (body) headers['Content-Type'] = 'application/json';
  if (token) headers.Authorization = 'Bearer ' + token;
  const r = await fetch(path, { method, headers, body: body ? JSON.stringify(body) : undefined });
  const data = await r.json().catch(() => ({}));
  if (!r.ok) throw Object.assign(new Error(data.error || 'Request failed (' + r.status + ')'), { status: r.status });
  return data;
}
function toast(msg) { const t = $('toast'); t.textContent = msg; t.classList.add('show'); clearTimeout(toast.h); toast.h = setTimeout(() => t.classList.remove('show'), 3400); }
function timeAgo(ms) {
  const s = Math.max(0, Math.round((Date.now() - ms) / 1000));
  if (s < 45) return 'just now';
  const m = Math.round(s / 60); if (m < 60) return m + ' min ago';
  const h = Math.round(m / 60); if (h < 24) return h + ' h ago';
  return Math.round(h / 24) + ' d ago';
}

const S = {
  parts: [], categories: [], form: { persona: 'tech', prefer: 'genuine', delivery: 'pickup' },
  activeId: null, view: null, poll: null,
  mine: store.get('purza.requests', []),
  shop: store.get('purza.shop', null), inbox: null, inboxPoll: null, shopFilter: 'open', reply: null,
  guideCat: 'all', guideQ: '', guideOpen: new Set(), listings: [], zones: [], areas: [], listingZone: 'All', listingArea: 'All', vehicles: []
};
const partById = id => S.parts.find(p => p.id === id);

// ---------- routing ----------
function route() {
  const v = (location.hash || '#find').slice(1);
  const view = VIEWS.includes(v) ? v : 'find';
  for (const id of VIEWS) $('view-' + id).classList.toggle('active', id === view);
  document.querySelectorAll('nav.tabs a').forEach(a => { if (a.dataset.view === view) a.setAttribute('aria-current', 'page'); else a.removeAttribute('aria-current'); });
  if (view === 'shop') startInbox(); else stopInbox();
  if (view === 'markets') loadShops();
}

// ---------- find ----------
function buildPartSelect() {
  let h = '<option value="">Choose a part…</option>';
  for (const c of S.categories) {
    const ps = S.parts.filter(p => p.category === c.code);
    if (ps.length) h += '<optgroup label="' + esc(c.name) + '">' + ps.map(p => '<option value="' + esc(p.id) + '">' + esc(p.short_name) + '</option>').join('') + '</optgroup>';
  }
  $('part').innerHTML = h + '<option value="other">Something else (use my description)</option>';
}
function setSeg(group, val) {
  S.form[group] = val;
  document.querySelectorAll('.seg[data-group="' + group + '"] button').forEach(b => b.setAttribute('aria-pressed', String(b.dataset.val === val)));
  if (group === 'persona') $('fee-note').textContent = val === 'tech' ? 'Technicians: free with Purza Pro (₹299/month). Delivery ₹60.' : 'Households: ₹29 for parts under ₹500, ₹49 above, ₹0 if no shop has it. Delivery ₹60.';
}
let suggestTimer = null;
function onDescribe() {
  clearTimeout(suggestTimer);
  suggestTimer = setTimeout(async () => {
    const q = $('describe').value.trim();
    const box = $('suggest');
    if (q.length < 3) { box.innerHTML = ''; return; }
    try {
      const r = await api('GET', '/api/parts?q=' + encodeURIComponent(q.slice(0, 80)));
      const p = r.parts[0];
      box.innerHTML = p && $('part').value !== p.id ? '<span>Sounds like: <b>' + esc(p.short_name) + '</b></span><button type="button" class="linkbtn" data-use="' + esc(p.id) + '">Use this</button>' : '';
    } catch (e) { box.innerHTML = ''; }
  }, 250);
}
function renderGuideCard() {
  const p = partById($('part').value);
  const el = $('guide-card');
  if (!p || !p.listed_price_inr) { el.innerHTML = '<div class="label">Price guide</div><p class="small muted">Choose a part to see what it sells for online.</p><a class="small" href="#prices">See all parts</a>'; return; }
  el.innerHTML = '<div class="label">Price guide · ' + esc(p.short_name) + '</div>'
    + '<div><span class="num" style="font-size:22px">' + inr(p.listed_price_inr.low) + '–' + inr(p.listed_price_inr.high) + '</span><div class="small muted">' + p.listings_count + ' prices listed online' + (p.genuine_inr ? ' · genuine ' + inr(p.genuine_inr[0]) + '–' + inr(p.genuine_inr[1]) : '') + '</div></div>'
    + '<div>' + p.listings.slice(0, 4).map(l => '<div class="listing"><span>' + esc(l.description) + '</span><span class="num">' + inr(l.price_inr) + '</span><a class="small" href="' + esc(l.url) + '" target="_blank" rel="noopener">' + esc(l.source) + '</a><span class="small muted">' + esc(l.kind) + '</span></div>').join('') + '</div>'
    + '<p class="small muted">Check before fitting: ' + esc(p.check) + '</p>';
}
function fillDemo() {
  setSeg('persona', 'tech'); setSeg('prefer', 'genuine'); setSeg('delivery', 'deliver');
  $('part').value = 'ac-capacitor'; $('sticker').value = 'Voltas 1.5 T split AC'; $('area').value = 'Kurla'; renderNear();
  $('describe').value = 'AC outdoor unit hums, compressor not starting'; $('budget').value = '';
  renderGuideCard(); $('suggest').innerHTML = '';
  toast('Example filled in. Press "Ask the market".');
}
async function onAsk(e) {
  e.preventDefault();
  const err = $('ask-error'); err.textContent = '';
  const v = $('part').value, describe = $('describe').value.trim();
  const body = { persona: S.form.persona, prefer: S.form.prefer, delivery: S.form.delivery, area: $('area').value.trim(), sticker: $('sticker').value.trim(), note: describe, include_demo: $('include-demo').checked, via: 'person' };
  if (v && v !== 'other') body.part_id = v;
  else if (v === 'other' && describe.length >= 3) { body.part_name = describe.slice(0, 80); body.category = S.aiCategory || 'general'; }
  else { err.textContent = v === 'other' ? 'Describe the part in a few words.' : 'Choose the part or describe it.'; return; }
  const budget = $('budget').value.replace(/[,\s₹]/g, '');
  if (budget && !/^\d{1,6}$/.test(budget)) { err.textContent = 'Budget should be a number of rupees.'; return; }
  if (budget) body.max_price_inr = Number(budget);
  const btn = $('ask-btn'); btn.disabled = true; btn.textContent = 'Asking the shops…';
  try {
    const r = await api('POST', '/api/requests', body);
    S.mine.unshift({ id: r.request.id, token: r.buyer_token, part_name: r.request.part_name, created_at: r.request.created_at });
    S.mine = S.mine.slice(0, 30); store.set('purza.requests', S.mine);
    $('describe').value = ''; $('suggest').innerHTML = ''; resetPhoto();
    openRequest(r.request.id, r);
  } catch (ex) { err.textContent = ex.message; }
  finally { btn.disabled = false; btn.textContent = 'Ask the market'; }
}
function openRequest(id, data) {
  S.activeId = id; S.view = data || null;
  clearInterval(S.poll);
  renderActive(); renderMine();
  const tick = async () => {
    if (S.activeId !== id) return;
    try { S.view = await api('GET', '/api/requests/' + encodeURIComponent(id)); renderActive(); renderMine(); }
    catch (e) { if (e.status === 404) { S.view = { gone: true }; renderActive(); clearInterval(S.poll); } }
    if (S.view && S.view.request && S.view.request.status !== 'open' && S.view.request.status !== 'reserved') clearInterval(S.poll);
  };
  if (!data) tick();
  S.poll = setInterval(tick, 2500);
}
function tokenFor(id) { const m = S.mine.find(x => x.id === id); return m ? m.token : null; }
function introHTML() {
  return '<div class="label">How it works</div><ol class="how">'
    + '<li><b>Ask once.</b> The part\'s name or a description of what\'s broken.</li>'
    + '<li><b>Every matching shop gets it.</b> Shopkeepers tap "have it" or "don\'t", with price, genuine or compatible, warranty and ready time.</li>'
    + '<li><b>Choose on facts.</b> Offers are ranked by what you want and each price is checked against prices listed online.</li>'
    + '<li><b>Reserve and pay by UPI.</b> Collect with a pickup code, or get it delivered for ₹60.</li></ol>'
    + '<p class="small muted" style="margin-top:14px">Try it on two devices: post a request here, then reply from <a href="#shop">Shop desk</a> on your phone.</p>';
}
function renderActive() {
  const el = $('live');
  if (!S.activeId) { el.innerHTML = introHTML(); return; }
  const v = S.view;
  if (!v) { el.innerHTML = '<p class="muted">Loading the request…</p>'; return; }
  if (v.gone) { el.innerHTML = '<p class="muted">This request no longer exists.</p><p style="margin-top:10px"><button class="btn ghost small" data-act="new" type="button">New request</button></p>'; return; }
  const r = v.request, sm = v.summary;
  const mine = !!tokenFor(r.id);
  const open = r.status === 'open';
  const step = r.status === 'paid' ? 4 : r.status === 'reserved' ? 3 : sm.have_it ? 2 : 1;
  let h = '<div class="req-head"><div class="ph">' + esc(CAT_SHORT[r.category] || 'PART') + '</div><div>'
    + '<div class="hstack between"><h3>' + esc(r.part_name) + '</h3><span class="tag status-' + esc(r.status) + '">' + esc(r.status) + '</span></div>'
    + '<p class="small muted">' + esc([r.local_name, r.appliance, r.sticker].filter(Boolean).join(' · ')) + '</p>'
    + '<p class="small">' + (r.persona === 'tech' ? 'Technician' : 'Household') + (r.area ? ' in ' + esc(r.area) : '') + ' · ' + esc(PREFER[r.prefer]) + ' · ' + (r.delivery === 'deliver' ? 'delivery' : 'pickup') + (r.max_price_inr ? ' · budget ' + inr(r.max_price_inr) : '') + ' · ' + timeAgo(r.created_at) + '</p>'
    + (r.check ? '<p class="small muted">Shops check: ' + esc(r.check) + '</p>' : '') + '</div></div>'
    + '<ol class="steps">' + ['Asked', 'Shops replying', 'Reserved', 'Paid'].map((s, i) => '<li class="' + (i + 1 < step ? 'done' : i + 1 === step ? 'on' : '') + '">' + s + '</li>').join('') + '</ol>';
  if (r.status === 'cancelled') h += '<p class="muted">This request was cancelled.</p>';
  else {
    h += '<p class="small"><b>' + sm.shops_asked + ' shops asked</b> · <span style="color:var(--good);font-weight:700">' + sm.have_it + ' have it</span> · ' + sm.dont_have + ' don\'t · ' + sm.yet_to_reply + ' yet to reply</p>';
    const pills = v.replies.slice().sort((a, b) => a.demo - b.demo || a.replied_at - b.replied_at).map(o => '<div class="pill ' + o.status + (o.demo ? '' : ' real') + '"><b>' + esc(o.shop) + '</b><span class="s">' + (o.status === 'yes' ? inr(o.price_inr) + ' · ' + esc(o.type) : 'Don\'t have') + '</span>' + (o.demo ? ' <span class="tag demo">demo</span>' : ' <span class="tag">Purza shop</span>') + '</div>').join('');
    h += pills ? '<div class="shops" style="margin-top:8px">' + pills + '</div>' : '<p class="small muted" style="margin-top:8px">Waiting for the first reply…</p>';
    if (v.offers.length) {
      h += '<h3 style="margin-top:16px">Offers, best first</h3><div class="tbl-wrap"><table><thead><tr><th>Shop</th><th>Part</th><th class="r">Price</th><th class="r">Warranty</th><th class="r">Ready</th><th>Price check</th>' + (mine && open ? '<th></th>' : '') + '</tr></thead><tbody>'
        + v.offers.map((o, i) => '<tr class="' + (o.best ? 'best' : '') + '"><td><b>' + esc(o.shop) + '</b><div class="small muted">' + esc([o.shop_no, o.market].filter(Boolean).join(', ')) + (o.demo ? ' · demo' : ' · Purza shop') + '</div>' + (o.best && v.best_reason ? '<div class="reason">' + esc(v.best_reason) + '</div>' : '') + '</td>'
          + '<td><span class="badge ' + (o.type === 'genuine' ? 'gen' : 'comp') + '">' + (o.type === 'genuine' ? 'Genuine' : 'Compatible') + '</span></td><td class="r num">' + inr(o.price_inr) + '</td><td class="r">' + (o.warranty_days ? o.warranty_days + ' days' : 'none') + '</td><td class="r">' + o.ready_in_min + ' min</td>'
          + '<td>' + (o.price_check ? '<span class="flag ' + esc(o.price_check.flag) + '">' + esc(o.price_check.text) + '</span>' : '<span class="flag muted">No listed price yet</span>') + '</td>'
          + (mine && open ? '<td class="r"><button class="btn small ' + (i === 0 ? 'brass' : 'ghost') + '" type="button" data-act="reserve" data-shop="' + esc(o.shop_id) + '">Reserve</button></td>' : '') + '</tr>').join('')
        + '</tbody></table></div>';
    }
    if (v.over_budget) h += '<p class="small muted">' + v.over_budget + ' more offer(s) are over your budget.</p>';
    if (open && !sm.yet_to_reply && !sm.have_it) h += '<p class="small" style="margin-top:12px">No shop has it right now. Purza charges nothing when that happens.</p>';
  }
  const rv = r.reserved;
  if (rv && (r.status === 'reserved' || r.status === 'paid')) {
    h += '<div class="receipt"><div class="hstack between"><div><div class="label">Reserved' + (r.status === 'paid' ? ' and paid' : '') + '</div><h3>' + esc(rv.shop) + '</h3><p class="small muted">' + esc([rv.shop_no, rv.market].filter(Boolean).join(', ')) + (rv.demo ? ' · demo shop' : ' · Purza shop') + '</p></div>'
      + '<div style="text-align:right"><div class="label">Pickup code</div><span class="code">' + esc(rv.pickup_code) + '</span></div></div>'
      + '<table><tbody><tr><td>' + esc(r.part_name) + ' · ' + esc(rv.type) + ' · ' + (rv.warranty_days || 0) + '-day warranty</td><td class="r num">' + inr(rv.part_price_inr) + '</td></tr>'
      + '<tr><td>Purza fee' + (r.persona === 'tech' ? ' (Pro plan)' : '') + '</td><td class="r num">' + inr(rv.fee_inr) + '</td></tr>'
      + (rv.delivery_inr ? '<tr><td>Delivery' + (r.area ? ' to ' + esc(r.area) : '') + '</td><td class="r num">' + inr(rv.delivery_inr) + '</td></tr>' : '')
      + '<tr class="total"><td>Total</td><td class="r num">' + inr(rv.total_inr) + '</td></tr></tbody></table>';
    if (r.status === 'paid') h += '<p class="small"><span class="tag live">Paid by UPI (demo)</span> ' + (r.delivery === 'deliver' ? 'The rider collects it with the code and brings it to you.' : 'Show the code at the counter.') + '</p>';
    else if (mine) h += '<div class="hstack"><button class="btn good" data-act="pay" type="button">Pay ' + inr(rv.total_inr) + ' by UPI</button><button class="btn ghost small" data-act="cancel" type="button">Cancel</button><span class="small muted">Demo mode: no money moves.</span></div>';
    h += '</div>';
  }
  h += '<div class="hstack" style="margin-top:14px">' + (mine && open ? '<button class="btn ghost small" data-act="cancel" type="button">Cancel request</button>' : '') + '<button class="btn ghost small" data-act="new" type="button">New request</button></div>';
  el.innerHTML = h;
}
async function onLiveClick(e) {
  const b = e.target.closest('button[data-act]');
  if (!b) return;
  const act = b.dataset.act, id = S.activeId;
  if (act === 'new') { S.activeId = null; S.view = null; clearInterval(S.poll); renderActive(); renderMine(); $('part').focus(); return; }
  const tok = tokenFor(id);
  if (!tok) return;
  b.disabled = true;
  try {
    if (act === 'reserve') { S.view = await api('POST', '/api/requests/' + id + '/reserve', { shop_id: b.dataset.shop }, tok); toast('Reserved. Pickup code ' + S.view.request.reserved.pickup_code); }
    else if (act === 'pay') { S.view = await api('POST', '/api/requests/' + id + '/pay', {}, tok); toast('Paid (demo). The shop sees it now.'); }
    else if (act === 'cancel') { S.view = await api('POST', '/api/requests/' + id + '/cancel', {}, tok); }
    renderActive(); renderMine();
  } catch (ex) { toast(ex.message); b.disabled = false; }
}
function renderMine() {
  const el = $('my-reqs');
  let h = '<div class="label">Your requests</div>';
  if (!S.mine.length) h += '<p class="small muted">None yet. Requests you post from this browser appear here.</p>';
  else h += '<div class="mini">' + S.mine.slice(0, 8).map(m => '<button class="req" type="button" data-rid="' + esc(m.id) + '" aria-current="' + (m.id === S.activeId) + '"><span><b>' + esc(m.part_name) + '</b><span class="small muted">' + timeAgo(m.created_at) + '</span></span><span class="small">' + (m.id === S.activeId && S.view && S.view.request ? esc(S.view.request.status) : 'open ›') + '</span></button>').join('') + '</div>';
  el.innerHTML = h;
}

// ---------- photo check (server calls Gemini or Claude) ----------
let photoToken = 0;
async function shrinkImage(file) {
  const bmp = await createImageBitmap(file);
  const k = Math.min(1, 1024 / Math.max(bmp.width, bmp.height));
  const c = document.createElement('canvas');
  c.width = Math.round(bmp.width * k); c.height = Math.round(bmp.height * k);
  c.getContext('2d').drawImage(bmp, 0, 0, c.width, c.height);
  return c.toDataURL('image/jpeg', 0.85);
}
async function onPhoto(e) {
  const file = e.target.files && e.target.files[0];
  e.target.value = '';
  if (!file) return;
  if (!/^image\//.test(file.type)) { toast('Choose a photo (JPG or PNG).'); return; }
  const line = $('ai-line'), token = ++photoToken;
  let dataURL;
  try { dataURL = await shrinkImage(file); } catch (err) { line.textContent = "Couldn't open that photo. Try another one."; return; }
  const prev = $('photo-prev'); prev.classList.remove('empty'); prev.innerHTML = '<img alt="Your photo" src="' + dataURL + '">';
  line.innerHTML = '<b>Reading the photo…</b>';
  try {
    const r = await api('POST', '/api/identify', { mime_type: 'image/jpeg', image_base64: dataURL.split(',')[1] });
    if (token === photoToken) applyAI(r);
  } catch (err) { if (token === photoToken) line.textContent = err.message; }
}
function applyAI(r) {
  const line = $('ai-line');
  const pct = r.confidence == null ? '' : ' · ' + Math.round(r.confidence * 100) + '% sure';
  if (r.part_id === 'none') { line.textContent = "That doesn't look like an appliance part. Try a closer photo, or pick from the list."; return; }
  if (r.label_text && !$('sticker').value) $('sticker').value = r.label_text;
  const p = partById(r.part_id);
  if (p) {
    S.aiCategory = null; $('part').value = p.id;
    line.innerHTML = 'Looks like <b>' + esc(p.short_name) + '</b>' + esc(pct) + ". Change it below if that's wrong.";
  } else {
    S.aiCategory = r.category || 'general'; $('part').value = 'other'; $('describe').value = r.part_name || '';
    line.innerHTML = 'Looks like <b>' + esc(r.part_name || 'a spare part') + '</b>' + esc(pct) + '. Not in the price guide yet; shops will still quote.';
  }
  $('suggest').innerHTML = ''; renderGuideCard();
}
function resetPhoto() {
  photoToken++; S.aiCategory = null;
  const prev = $('photo-prev'); prev.classList.add('empty'); prev.textContent = 'No photo';
  $('ai-line').textContent = 'AI reads the photo and picks the part.';
}

// ---------- shop desk ----------
function shopForm() {
  return '<div class="grid-2"><form class="card stack" id="shop-form" novalidate><div class="label">Add your shop</div>'
    + '<div class="field"><label for="sf-name">Shop name</label><input id="sf-name" maxlength="60" autocomplete="organization" placeholder="e.g. Kamdar Refrigeration Stores"></div>'
    + '<div class="row2"><div class="field"><label for="sf-no">Shop no.</label><input id="sf-no" maxlength="20" placeholder="e.g. Shop 7"></div>'
    + '<div class="field"><label for="sf-market">Area / market</label><select id="sf-market">' + areaOptions('Lohar Chawl') + '</select></div></div>'
    + '<fieldset class="field" style="border:0;padding:0;margin:0"><legend class="flabel" style="margin-bottom:4px">Parts you stock</legend><div class="checks">'
    + S.categories.filter(c => c.code !== 'general').map(c => '<label class="check"><input type="checkbox" name="sf-cat" value="' + esc(c.code) + '"><span>' + esc(c.name) + '</span></label>').join('') + '</div></fieldset>'
    + '<p class="err" id="sf-err" role="alert"></p><button class="btn brass" type="submit" style="justify-self:start">Start receiving requests</button></form>'
    + '<div class="card stack small"><div class="label">How it works for a shop</div><ol class="how"><li>Requests for the parts you stock arrive here.</li><li>Tap <b>Have genuine</b>, <b>Have compatible</b> or <b>Don\'t have</b>. Price chips come from the price guide.</li><li>When a buyer reserves your part you see the pickup code and the payment.</li><li>Free for 3 months, then 3% on orders through Purza.</li></ol>'
    + '<p class="muted">Your shop key is saved in this browser. Use the same browser (or phone) to reply.</p></div></div>';
}
function startInbox() {
  if (!S.shop) { if (!$('shop-form')) $('shop-root').innerHTML = shopForm(); return; }
  if (!$('inbox')) $('shop-root').innerHTML = '<div class="desk2"><aside class="stack" id="shop-side"></aside><div class="stack"><div class="filters" id="inbox-filter"></div><div class="inbox" id="inbox"><div class="card muted">Loading requests…</div></div></div></div>';
  loadInbox();
  clearInterval(S.inboxPoll);
  S.inboxPoll = setInterval(loadInbox, 3000);
}
function stopInbox() { clearInterval(S.inboxPoll); S.inboxPoll = null; }
async function loadInbox() {
  if (!S.shop) return;
  try { S.inbox = await api('GET', '/api/shop/inbox', null, S.shop.token); renderInbox(); }
  catch (e) {
    if (e.status === 401 || e.status === 403) { S.shop = null; store.set('purza.shop', null); stopInbox(); $('shop-root').innerHTML = shopForm(); toast('Shop key not recognised. Add your shop again.'); }
  }
}
function inboxFocused() { const a = document.activeElement; return !!(a && a.closest && a.closest('#inbox') && /^(INPUT|SELECT|TEXTAREA)$/.test(a.tagName)); }
function renderInbox() {
  if (!S.inbox || !$('inbox') || inboxFocused()) return;
  const { shop, open, orders } = S.inbox;
  const sales = orders.reduce((s, r) => s + (r.reserved ? r.reserved.part_price_inr : 0), 0);
  $('shop-side').innerHTML = '<div class="card stack"><div><div class="label">Your shop</div><h3>' + esc(shop.name) + '</h3><p class="small muted">' + esc([shop.shop_no, shop.market].filter(Boolean).join(', ')) + '</p></div>'
    + '<div class="cats">' + shop.categories.map(c => '<span class="cat">' + esc((S.categories.find(x => x.code === c) || {}).name || c) + '</span>').join('') + '</div>'
    + '<div class="stats"><div><b>' + open.filter(r => r.my_offer).length + '</b>replied</div><div><b>' + orders.length + '</b>orders</div><div><b>' + inr(sales) + '</b>sales</div></div>'
    + '<button class="btn ghost small" type="button" data-act="forget" style="justify-self:start">Use a different shop</button></div>';
  $('inbox-filter').innerHTML = [['open', 'Open requests · ' + open.length], ['orders', 'My orders · ' + orders.length]].map(([k, l]) => '<button type="button" data-filter="' + k + '" aria-pressed="' + (S.shopFilter === k) + '">' + l + '</button>').join('');
  const list = S.shopFilter === 'orders' ? orders : open;
  $('inbox').innerHTML = list.length ? list.map(cardHTML).join('') : '<div class="card muted">' + (S.shopFilter === 'orders' ? 'No orders yet. When a buyer reserves your offer it shows here with the pickup code.' : 'No open requests for your parts right now.') + '</div>';
}
function cardHTML(r) {
  const won = r.reserved && S.inbox && r.reserved.shop_id === S.inbox.shop.id;
  let h = '<article class="card reqcard' + (won ? ' won' : '') + '"><div class="ph">' + esc(CAT_SHORT[r.category] || 'PART') + '</div><div>'
    + '<div class="hstack between"><h3>' + esc(r.part_name) + '</h3><span class="small muted">' + timeAgo(r.created_at) + '</span></div>'
    + '<p class="small muted">' + esc([r.local_name, r.appliance, r.sticker].filter(Boolean).join(' · ')) + '</p>'
    + '<p class="small">' + (r.via === 'agent' ? '<span class="tag agent">AI agent</span> ' : '') + (r.persona === 'tech' ? 'Technician' : 'Household') + (r.area ? ' in ' + esc(r.area) : '') + ' · ' + esc(PREFER[r.prefer]) + ' · ' + (r.delivery === 'deliver' ? 'delivery' : 'pickup') + '</p>'
    + (r.note ? '<p class="small">"' + esc(r.note) + '"</p>' : '')
    + '<p class="small muted">' + (r.listed_price_inr ? 'Listed online: ' + inr(r.listed_price_inr.low) + '–' + inr(r.listed_price_inr.high) + ' · ' : '') + r.replies_count + ' shop' + (r.replies_count === 1 ? '' : 's') + ' replied</p>';
  if (won) {
    h += '<p style="margin-top:8px"><span class="tag live">' + (r.status === 'paid' ? 'Paid by UPI (demo)' : 'Reserved with you, awaiting payment') + '</span></p><p style="margin-top:6px">Pickup code <span class="code">' + esc(r.reserved.pickup_code) + '</span> · ' + inr(r.reserved.part_price_inr) + ' ' + esc(r.reserved.type) + '</p>';
  } else if (S.reply && S.reply.rid === r.id) {
    const rp = S.reply;
    const chips = (r.suggested_prices && r.suggested_prices[rp.type]) || [];
    h += '<div class="replyform"><div class="hstack"><span class="badge ' + (rp.type === 'genuine' ? 'gen' : 'comp') + '">' + (rp.type === 'genuine' ? 'Genuine' : 'Compatible') + '</span><span class="small muted">Your offer</span></div>'
      + '<div class="row2"><div class="field"><label for="rp-price">Price ₹</label><input id="rp-price" inputmode="numeric" maxlength="6" value="' + esc(rp.price) + '"></div>'
      + '<div class="field"><label for="rp-ready">Ready in</label><select id="rp-ready">' + [5, 10, 15, 30, 60, 120].map(m => '<option value="' + m + '"' + (rp.ready === m ? ' selected' : '') + '>' + m + ' min</option>').join('') + '</select></div></div>'
      + (chips.length ? '<div class="pchips">' + chips.map(p => '<button type="button" data-act="chip" data-price="' + p + '">' + inr(p) + '</button>').join('') + '</div>' : '')
      + '<div class="field"><label for="rp-warranty">Warranty</label><select id="rp-warranty">' + [0, 7, 15, 30, 90, 180, 365].map(d => '<option value="' + d + '"' + (rp.warranty === d ? ' selected' : '') + '>' + (d ? d + ' days' : 'None') + '</option>').join('') + '</select></div>'
      + '<p class="err" id="rp-err" role="alert"></p><div class="hstack"><button class="btn brass small" type="button" data-act="send" data-rid="' + esc(r.id) + '">Send offer</button><button class="btn ghost small" type="button" data-act="cancel-reply">Cancel</button></div></div>';
  } else if (r.my_offer) {
    h += '<p style="margin-top:8px" class="small"><b>You replied:</b> ' + (r.my_offer.status === 'yes' ? esc(r.my_offer.type) + ' at ' + inr(r.my_offer.price_inr) + ', ready in ' + r.my_offer.ready_in_min + ' min' : 'don\'t have it') + '</p>'
      + '<div class="acts"><button class="btn ghost small" type="button" data-act="have" data-type="genuine" data-rid="' + esc(r.id) + '">Change to genuine</button><button class="btn ghost small" type="button" data-act="have" data-type="compatible" data-rid="' + esc(r.id) + '">Change to compatible</button></div>';
  } else {
    h += '<div class="acts"><button class="btn good small" type="button" data-act="have" data-type="genuine" data-rid="' + esc(r.id) + '">Have genuine</button><button class="btn small" type="button" data-act="have" data-type="compatible" data-rid="' + esc(r.id) + '">Have compatible</button><button class="btn bad small" type="button" data-act="no" data-rid="' + esc(r.id) + '">Don\'t have</button></div>';
  }
  return h + '</div></article>';
}
async function onShopClick(e) {
  const f = e.target.closest('button[data-filter]');
  if (f) { S.shopFilter = f.dataset.filter; S.reply = null; renderInbox(); return; }
  const b = e.target.closest('button[data-act]');
  if (!b) return;
  const act = b.dataset.act;
  if (act === 'forget') { S.shop = null; store.set('purza.shop', null); stopInbox(); $('shop-root').innerHTML = shopForm(); return; }
  if (act === 'cancel-reply') { S.reply = null; renderInbox(); return; }
  if (act === 'chip') { S.reply.price = b.dataset.price; $('rp-price').value = b.dataset.price; return; }
  if (act === 'have') {
    const r = S.inbox.open.find(x => x.id === b.dataset.rid);
    const chips = (r && r.suggested_prices && r.suggested_prices[b.dataset.type]) || [];
    S.reply = { rid: b.dataset.rid, type: b.dataset.type, price: chips[Math.floor(chips.length / 2)] || '', ready: 10, warranty: b.dataset.type === 'genuine' ? 180 : 30 };
    renderInbox(); const i = $('rp-price'); if (i) { i.focus(); i.select(); }
    return;
  }
  b.disabled = true;
  try {
    if (act === 'no') { await api('POST', '/api/requests/' + b.dataset.rid + '/offers', { status: 'no' }, S.shop.token); toast('Sent: don\'t have'); }
    if (act === 'send') {
      const price = Number(String($('rp-price').value).replace(/[,\s₹]/g, ''));
      const r = await api('POST', '/api/requests/' + b.dataset.rid + '/offers', { status: 'yes', type: S.reply.type, price_inr: price, warranty_days: Number($('rp-warranty').value), ready_in_min: Number($('rp-ready').value) }, S.shop.token);
      S.reply = null; if (document.activeElement) document.activeElement.blur();
      toast(r.price_check && r.price_check.flag === 'high' ? 'Sent. Note: your price is above prices listed online.' : 'Offer sent. The buyer sees it now.');
    }
    await loadInbox();
  } catch (ex) { if ($('rp-err')) $('rp-err').textContent = ex.message; else toast(ex.message); b.disabled = false; }
}
async function onShopSubmit(e) {
  if (e.target.id !== 'shop-form') return;
  e.preventDefault();
  const body = { name: $('sf-name').value.trim(), shop_no: $('sf-no').value.trim(), market: $('sf-market').value, categories: [...document.querySelectorAll('input[name="sf-cat"]:checked')].map(i => i.value) };
  const btn = e.target.querySelector('button[type=submit]'); btn.disabled = true;
  try {
    const r = await api('POST', '/api/shops', body);
    S.shop = { id: r.shop.id, token: r.shop_token, name: r.shop.name }; store.set('purza.shop', S.shop);
    $('shop-root').innerHTML = ''; startInbox(); toast('Your shop is live. Requests for your parts appear here.');
  } catch (ex) { $('sf-err').textContent = ex.message; btn.disabled = false; }
}

// ---------- price guide, markets, agents, cars ----------
function renderGuide() {
  $('guide-cats').innerHTML = [{ code: 'all', name: 'All' }].concat(S.categories.filter(c => S.parts.some(p => p.category === c.code))).map(c => '<button type="button" data-cat="' + esc(c.code) + '" aria-pressed="' + (S.guideCat === c.code) + '">' + esc(c.name) + '</button>').join('');
  const q = S.guideQ.toLowerCase().trim();
  const rows = S.parts.filter(p => (S.guideCat === 'all' || p.category === S.guideCat) && (!q || (p.name + ' ' + p.short_name + ' ' + p.local_name + ' ' + p.appliance).toLowerCase().includes(q)));
  const rng = r => r ? inr(r[0]) + (r[1] !== r[0] ? '–' + inr(r[1]) : '') : '<span class="muted">none listed</span>';
  let h = '<thead><tr><th>Part</th><th>Used in</th><th class="r">Listed online</th><th class="r">Genuine</th><th class="r">Compatible / trade</th><th class="r">Listings</th></tr></thead><tbody>';
  if (!rows.length) h += '<tr><td colspan="6" class="muted">No part matches.</td></tr>';
  for (const p of rows) {
    const open = S.guideOpen.has(p.id);
    h += '<tr><td><b>' + esc(p.name) + '</b><span class="sub">' + esc(p.local_name) + '</span></td><td class="small">' + esc(p.appliance) + '</td><td class="r num">' + (p.listed_price_inr ? rng([p.listed_price_inr.low, p.listed_price_inr.high]) : rng(null)) + '</td><td class="r num">' + rng(p.genuine_inr) + '</td><td class="r num">' + rng(p.compatible_inr) + '</td>'
      + '<td class="r"><button class="exp" type="button" data-part="' + esc(p.id) + '" aria-expanded="' + open + '">' + p.listings_count + (open ? ' ▲' : ' ▼') + '</button></td></tr>';
    if (open) h += '<tr class="detail"><td colspan="6"><div class="small muted" style="margin-bottom:4px">Check before fitting: ' + esc(p.check) + '</div>' + p.listings.map(l => '<div class="listing"><span>' + esc(l.description) + ' <span class="badge ' + (l.kind === 'genuine' ? 'gen' : 'comp') + '">' + esc(l.kind) + '</span></span><span class="num">' + inr(l.price_inr) + '</span><a class="small" href="' + esc(l.url) + '" target="_blank" rel="noopener">' + esc(l.source) + '</a><span></span></div>').join('') + '</td></tr>';
  }
  $('guide-table').innerHTML = h + '</tbody>';
}
async function loadShops() {
  try {
    const r = await api('GET', '/api/shops');
    const real = r.shops.filter(s => !s.demo);
    $('purza-shops').innerHTML = real.length ? '<table><thead><tr><th>Shop</th><th>Area</th><th>Stocks</th><th class="r">Joined</th></tr></thead><tbody>' + real.map(s => '<tr><td><b>' + esc(s.name) + '</b><div class="small muted">' + esc(s.shop_no) + '</div></td><td>' + esc(s.market) + '</td><td class="small">' + s.categories.map(c => esc((S.categories.find(x => x.code === c) || {}).name || c)).join(', ') + '</td><td class="r small">' + timeAgo(s.created_at) + '</td></tr>').join('') + '</tbody></table>' : '<p class="muted">No shop has joined yet. Add one on the <a href="#shop">Shop desk</a>.</p>';
  } catch (e) { $('purza-shops').innerHTML = '<p class="muted">Couldn\'t load shops.</p>'; }
}
const NO_AREA = 'Area not listed';
function areaOptions(sel) {
  if (!S.areas.length) return MARKETS.map(m => '<option' + (m === sel ? ' selected' : '') + '>' + esc(m) + '</option>').join('');
  return S.zones.map(z => '<optgroup label="' + esc(z) + '">' + S.areas.filter(a => a.zone === z).map(a => '<option' + (a.name === sel ? ' selected' : '') + '>' + esc(a.name) + '</option>').join('') + '</optgroup>').join('')
    + '<option' + (sel === 'Other Mumbai' ? ' selected' : '') + '>Other Mumbai</option>';
}
function renderListings() {
  const L = S.listings, zones = S.zones.concat([NO_AREA]);
  const withShops = new Set(L.map(l => l.area).filter(a => a !== NO_AREA));
  $('listing-cover').innerHTML = '<b>' + L.length + ' shops</b> found in <b>' + withShops.size + ' of ' + S.areas.length + '</b> Mumbai areas. Pick a zone, then an area.';
  $('listing-filter').innerHTML = ['All'].concat(zones).map(z => { const n = z === 'All' ? L.length : L.filter(l => l.zone === z).length; return n || z === 'All' ? '<button type="button" data-zone="' + esc(z) + '" aria-pressed="' + (S.listingZone === z) + '">' + esc(z === 'All' ? 'All Mumbai' : z) + ' · ' + n + '</button>' : ''; }).join('');
  const inZone = L.filter(l => S.listingZone === 'All' || l.zone === S.listingZone);
  const areas = S.listingZone === 'All' || S.listingZone === NO_AREA ? [] : S.areas.filter(a => a.zone === S.listingZone && withShops.has(a.name));
  $('listing-areas').innerHTML = areas.length ? ['All'].concat(areas.map(a => a.name)).map(a => '<button type="button" data-area="' + esc(a) + '" aria-pressed="' + (S.listingArea === a) + '">' + esc(a === 'All' ? 'Every area' : a) + ' · ' + (a === 'All' ? inZone.length : L.filter(l => l.area === a).length) + '</button>').join('') : '';
  $('listing-areas').hidden = !areas.length;
  const rows = inZone.filter(l => S.listingArea === 'All' || l.area === S.listingArea);
  $('listings').innerHTML = '<thead><tr><th>Business</th><th>Area</th><th>Address</th><th>Sells</th><th>Source</th></tr></thead><tbody>' + rows.map(l => '<tr><td><b>' + esc(l.name) + '</b></td><td class="nowrap">' + esc(l.area) + '<div class="small muted">' + esc(l.zone) + '</div></td><td class="small">' + esc(l.address) + '</td><td class="small">' + esc(l.sells) + '</td><td class="small"><a href="' + esc(l.source_url) + '" target="_blank" rel="noopener">' + esc(l.source_name) + '</a></td></tr>').join('') + '</tbody>';
}
// Same area matching as the server (src/logic.js findArea).
function normArea(t) { return ' ' + String(t || '').toLowerCase().replace(/\brd\b/g, 'road').replace(/[^a-z]+/g, ' ').replace(/\b(east|west|e|w|mumbai|station)\b/g, ' ').replace(/\s+/g, ' ').trim() + ' '; }
function findArea(text) {
  const t = normArea(text);
  if (t.trim().length < 3) return null;
  const names = a => [a.name].concat(a.aka || []).map(normArea);
  return S.areas.find(a => names(a).includes(t)) || S.areas.find(a => names(a).some(n => t.includes(n))) || S.areas.find(a => names(a).some(n => n.trim().startsWith(t.trim()))) || null;
}
function renderNear() {
  const el = $('near-shops'), v = $('area').value, area = findArea(v);
  if (!area) { el.hidden = v.trim().length < 3 || !S.areas.length; el.innerHTML = el.hidden ? '' : 'Not a Mumbai area we know yet. Your request still goes to every shop.'; return; }
  let shops = S.listings.filter(l => l.area === area.name); const exact = shops.length > 0;
  if (!exact) shops = S.listings.filter(l => l.zone === area.zone);
  el.hidden = false;
  el.innerHTML = '<b>' + (exact ? 'Parts shops in ' + esc(area.name) : 'No shop listed in ' + esc(area.name) + ' yet. Nearest in ' + esc(area.zone)) + '</b> <span class="muted">(' + shops.length + ')</span>'
    + '<ul>' + shops.slice(0, 5).map(l => '<li>' + esc(l.name) + ' <span class="muted">· ' + esc(l.address) + (exact ? '' : ', ' + esc(l.area)) + '</span></li>').join('') + '</ul>'
    + '<button type="button" class="linkbtn" data-area="' + esc(exact ? area.name : '') + '" data-zone="' + esc(area.zone) + '">See ' + (exact ? 'all shops in ' + esc(area.name) : 'every shop in ' + esc(area.zone)) + ' →</button>';
}
function fillSelect(sel, values, label) { const v = sel.value; sel.innerHTML = '<option value="">' + label + '</option>' + values.map(x => '<option' + (String(x) === v ? ' selected' : '') + '>' + esc(x) + '</option>').join(''); }
function syncCars() {
  const y = $('car-year').value, mk = $('car-make').value, vs = S.vehicles;
  fillSelect($('car-year'), [...new Set(vs.map(v => v.year))].sort((a, b) => b - a), 'Any year');
  fillSelect($('car-make'), [...new Set(vs.filter(v => !y || v.year === Number(y)).map(v => v.make))].sort(), 'Any make');
  fillSelect($('car-model'), [...new Set(vs.filter(v => (!y || v.year === Number(y)) && (!mk || v.make === mk)).map(v => v.model))].sort(), 'Any model');
}
async function searchCars(e) {
  if (e) e.preventDefault();
  const qs = new URLSearchParams();
  for (const [k, id] of [['year', 'car-year'], ['make', 'car-make'], ['model', 'car-model'], ['part', 'car-q']]) if ($(id).value.trim()) qs.set(k, $(id).value.trim());
  try {
    const r = await api('GET', '/api/search?' + qs);
    $('car-results').innerHTML = r.parts.length ? '<table><thead><tr><th>Part no.</th><th>Part</th><th>Category</th><th>Fits</th></tr></thead><tbody>' + r.parts.map(p => '<tr><td class="num">' + esc(p.part_number) + '</td><td><b>' + esc(p.name) + '</b></td><td>' + esc(p.category) + '</td><td class="small">' + p.fits.map(v => esc(v.year + ' ' + v.make + ' ' + v.model + ' ' + v.trim)).join('<br>') + '</td></tr>').join('') + '</tbody></table><p class="small muted" style="margin-top:8px">' + esc(r.note) + '</p>' : '<p class="muted">No sample part matches.</p>';
  } catch (ex) { $('car-results').innerHTML = '<p class="err">' + esc(ex.message) + '</p>'; }
}
function renderCurl() {
  const o = location.origin;
  $('curl').textContent = '# 1. find the part\ncurl "' + o + '/api/parts?q=geyser%20not%20heating"\n\n# 2. ask every matching shop\ncurl -X POST ' + o + '/api/requests \\\n  -H "Content-Type: application/json" \\\n  -d \'{"part_id":"geyser-element","persona":"home","prefer":"genuine","delivery":"deliver","area":"Andheri West","max_price_inr":700,"via":"agent"}\'\n\n# 3. read ranked offers (poll for about a minute)\ncurl ' + o + '/api/requests/REQUEST_ID\n\n# 4. reserve the best one\ncurl -X POST ' + o + '/api/requests/REQUEST_ID/reserve \\\n  -H "Content-Type: application/json" \\\n  -H "Authorization: Bearer BUYER_TOKEN" \\\n  -d \'{"shop_id":"SHOP_ID"}\'';
}

// ---------- hooks for the copilot panel (public/copilot.js) ----------
window.PurzaUI = {
  show(a) {
    if (!VIEWS.includes(a.view)) return;
    if (a.view === 'markets' && a.zone) { S.listingZone = a.zone; S.listingArea = a.area || 'All'; renderListings(); }
    if (a.view === 'find' && a.area) { $('area').value = a.area; renderNear(); }
    if (a.part_id && partById(a.part_id)) {
      if (a.view === 'find') { $('part').value = a.part_id; renderGuideCard(); }
      if (a.view === 'prices') { S.guideQ = ''; $('guide-q').value = ''; S.guideCat = 'all'; S.guideOpen.add(a.part_id); renderGuide(); }
    }
    if (location.hash !== '#' + a.view) location.hash = '#' + a.view; else route();
    setTimeout(() => {
      const el = a.view === 'markets' && a.zone ? $('listing-cover') : a.view === 'prices' && a.part_id ? document.querySelector('#guide-table button[data-part="' + a.part_id + '"]') : null;
      if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }, 150);
  },
  openRequest(a) {
    if (!a || !a.id) return;
    if (!S.mine.some(m => m.id === a.id)) {
      S.mine.unshift({ id: a.id, token: a.token, part_name: a.part_name, created_at: a.created_at || Date.now() });
      S.mine = S.mine.slice(0, 30); store.set('purza.requests', S.mine);
    }
    if (location.hash !== '#find') location.hash = '#find';
    openRequest(a.id);
  }
};

// ---------- start ----------
function bind() {
  window.addEventListener('hashchange', route);
  document.querySelectorAll('.seg').forEach(seg => seg.addEventListener('click', e => { const b = e.target.closest('button[data-val]'); if (b) setSeg(seg.dataset.group, b.dataset.val); }));
  $('part').addEventListener('change', () => { $('ask-error').textContent = ''; if ($('part').value !== 'other') S.aiCategory = null; renderGuideCard(); onDescribe(); });
  $('upload').addEventListener('change', onPhoto);
  $('describe').addEventListener('input', onDescribe);
  $('suggest').addEventListener('click', e => { const b = e.target.closest('button[data-use]'); if (b) { $('part').value = b.dataset.use; $('suggest').innerHTML = ''; renderGuideCard(); } });
  $('ask-form').addEventListener('submit', onAsk);
  $('fill-demo').addEventListener('click', fillDemo);
  $('live').addEventListener('click', onLiveClick);
  $('my-reqs').addEventListener('click', e => { const b = e.target.closest('button[data-rid]'); if (b) openRequest(b.dataset.rid); });
  const sr = $('shop-root');
  sr.addEventListener('click', onShopClick);
  sr.addEventListener('submit', onShopSubmit);
  sr.addEventListener('input', e => { if (S.reply && e.target.id === 'rp-price') S.reply.price = e.target.value; });
  sr.addEventListener('change', e => { if (!S.reply) return; if (e.target.id === 'rp-ready') S.reply.ready = Number(e.target.value); if (e.target.id === 'rp-warranty') S.reply.warranty = Number(e.target.value); });
  sr.addEventListener('keydown', e => { if (e.key === 'Enter' && e.target.id === 'rp-price') { e.preventDefault(); const b = sr.querySelector('button[data-act="send"]'); if (b) b.click(); } });
  $('guide-q').addEventListener('input', e => { S.guideQ = e.target.value; renderGuide(); });
  $('guide-cats').addEventListener('click', e => { const b = e.target.closest('button[data-cat]'); if (b) { S.guideCat = b.dataset.cat; renderGuide(); } });
  $('guide-table').addEventListener('click', e => { const b = e.target.closest('button[data-part]'); if (!b) return; if (S.guideOpen.has(b.dataset.part)) S.guideOpen.delete(b.dataset.part); else S.guideOpen.add(b.dataset.part); renderGuide(); });
  $('listing-filter').addEventListener('click', e => { const b = e.target.closest('button[data-zone]'); if (b) { S.listingZone = b.dataset.zone; S.listingArea = 'All'; renderListings(); } });
  $('listing-areas').addEventListener('click', e => { const b = e.target.closest('button[data-area]'); if (b) { S.listingArea = b.dataset.area; renderListings(); } });
  $('area').addEventListener('input', renderNear);
  $('near-shops').addEventListener('click', e => { const b = e.target.closest('button[data-zone]'); if (!b) return; S.listingZone = b.dataset.zone; S.listingArea = b.dataset.area || 'All'; renderListings(); location.hash = '#markets'; });
  $('car-form').addEventListener('submit', searchCars);
  for (const id of ['car-year', 'car-make']) $(id).addEventListener('change', () => { syncCars(); searchCars(); });
  $('car-model').addEventListener('change', () => searchCars());
}
async function init() {
  bind(); setSeg('persona', 'tech'); renderActive(); renderMine(); renderGuideCard(); renderCurl();
  try {
    const [cats, parts, listings, vehicles, llms] = await Promise.all([
      api('GET', '/api/categories'), api('GET', '/api/parts'), api('GET', '/api/listings'), api('GET', '/api/vehicles'), fetch('/llms.txt').then(r => r.text())
    ]);
    S.categories = cats.appliance; S.parts = parts.parts; S.listings = listings.listings; S.zones = listings.zones || []; S.areas = listings.areas || []; S.vehicles = vehicles.vehicles;
    if (S.areas.length) { MARKETS = S.areas.map(a => a.name).concat(['Other Mumbai']); $('area-list').innerHTML = S.areas.map(a => '<option value="' + esc(a.name) + '">' + esc(a.zone) + '</option>').join(''); }
    $('llms').textContent = llms;
    buildPartSelect(); renderGuide(); renderListings(); syncCars(); searchCars();
    $('api-chip').classList.add('on'); $('api-chip-text').textContent = 'Connected to the Purza API';
    try { const h = await api('GET', '/api/health'); if (h.ai) { $('photo-field').hidden = false; $('api-chip-text').textContent = 'Connected · AI photo check on'; } } catch (e) { /* photo check stays hidden */ }
  } catch (e) {
    $('api-chip').classList.add('off'); $('api-chip-text').textContent = 'API not reachable';
    toast('Could not reach the Purza API. Is the server running?');
  }
  route();
}
init();
})();
