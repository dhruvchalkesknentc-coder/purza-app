'use strict';
// Purza API + website. Plain Node.js (22.5+), no npm packages: node:http for the server, node:sqlite for the database.
const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const { openDb, tx } = require('./db');
const L = require('./logic');
const payments = require('./payments');
const photoCheck = require('./identify');

const PUBLIC_DIR = path.join(__dirname, '..', 'public');
const MAX_BODY = 32 * 1024;
const MAX_PHOTO_BODY = 6 * 1024 * 1024;
const INBOX_DAYS = 7;
const TYPES = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8', '.svg': 'image/svg+xml', '.png': 'image/png', '.ico': 'image/x-icon', '.json': 'application/json; charset=utf-8', '.txt': 'text/plain; charset=utf-8' };
const SECURITY_HEADERS = {
  'X-Content-Type-Options': 'nosniff',
  'X-Frame-Options': 'DENY',
  'Referrer-Policy': 'no-referrer',
  'Permissions-Policy': 'camera=(), microphone=(), geolocation=()',
  'Content-Security-Policy': "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com; img-src 'self' data: blob:; connect-src 'self'; frame-ancestors 'none'; base-uri 'none'; form-action 'self'"
};

class HttpError extends Error { constructor(status, message) { super(message); this.status = status; } }
const fail = (status, message) => { throw new HttpError(status, message); };

const newId = prefix => prefix + '_' + crypto.randomBytes(9).toString('base64url');
const newToken = () => crypto.randomBytes(24).toString('base64url');
const hashToken = t => crypto.createHash('sha256').update(String(t)).digest('hex');
function sameHash(a, b) { return typeof a === 'string' && typeof b === 'string' && a.length === b.length && crypto.timingSafeEqual(Buffer.from(a), Buffer.from(b)); }
function bearer(req) { const m = /^Bearer\s+([A-Za-z0-9_-]{20,100})$/.exec(req.headers.authorization || ''); return m ? m[1] : null; }
const ID_RE = { req: /^req_[A-Za-z0-9_-]{6,40}$/, shop: /^(shop_[A-Za-z0-9_-]{6,40}|demo-[a-z]{2,20})$/ };

function str(v, max, name, { required = false, min = 0 } = {}) {
  if (v == null || v === '') { if (required) fail(400, name + ' is required'); return ''; }
  if (typeof v !== 'string') fail(400, name + ' must be text');
  const s = v.trim();
  if (s.length < min || s.length > max) fail(400, name + ' must be ' + (min ? min + ' to ' : 'at most ') + max + ' characters');
  return s;
}
function oneOf(v, allowed, name, dflt) {
  if (v == null || v === '') return dflt;
  if (!allowed.includes(v)) fail(400, name + ' must be one of: ' + allowed.join(', '));
  return v;
}
function intOrNull(v, lo, hi, name) {
  if (v == null || v === '') return null;
  const n = Number(v);
  if (!Number.isInteger(n) || n < lo || n > hi) fail(400, name + ' must be a whole number from ' + lo + ' to ' + hi);
  return n;
}

function rateLimiter(perMinute) {
  const hits = new Map();
  return ip => {
    const t = Date.now();
    let h = hits.get(ip);
    if (!h || t - h.start > 60000) { h = { start: t, n: 0 }; hits.set(ip, h); }
    h.n++;
    if (hits.size > 5000) for (const [k, v] of hits) if (t - v.start > 60000) hits.delete(k);
    return h.n <= perMinute;
  };
}

function statements(db) {
  const p = sql => db.prepare(sql);
  return {
    categories: p('SELECT code, name FROM categories ORDER BY rowid'),
    carCategories: p('SELECT id, name FROM car_categories ORDER BY name'),
    parts: p('SELECT * FROM appliance_parts ORDER BY category, name'),
    part: p('SELECT * FROM appliance_parts WHERE id = ?'),
    listingsFor: p('SELECT description, price_inr, kind, source_name, source_url, collected_on FROM price_listings WHERE part_id = ? ORDER BY price_inr'),
    shops: p("SELECT s.id, s.name, s.shop_no, s.market, s.demo, s.created_at, group_concat(c.category) AS cats FROM shops s LEFT JOIN shop_categories c ON c.shop_id = s.id GROUP BY s.id ORDER BY s.demo, s.created_at DESC"),
    shop: p('SELECT s.*, group_concat(c.category) AS cats FROM shops s LEFT JOIN shop_categories c ON c.shop_id = s.id WHERE s.id = ? GROUP BY s.id'),
    shopByToken: p('SELECT s.*, (SELECT group_concat(category) FROM shop_categories WHERE shop_id = s.id) AS cats FROM shops s WHERE s.token_hash = ?'),
    insertShop: p('INSERT INTO shops (id, name, shop_no, market, demo, token_hash, created_at) VALUES (?, ?, ?, ?, 0, ?, ?)'),
    insertShopCat: p('INSERT INTO shop_categories (shop_id, category) VALUES (?, ?)'),
    realShopsFor: p("SELECT COUNT(DISTINCT s.id) AS n FROM shops s JOIN shop_categories c ON c.shop_id = s.id WHERE s.demo = 0 AND (c.category = :cat OR :cat = 'general')"),
    insertRequest: p(`INSERT INTO requests (id, part_id, part_name, category, local_name, appliance, check_note, persona, prefer, delivery, area, sticker, note, max_price_inr, via, demo_shops_asked, buyer_token_hash, status, created_at)
      VALUES (:id, :part_id, :part_name, :category, :local_name, :appliance, :check_note, :persona, :prefer, :delivery, :area, :sticker, :note, :max_price_inr, :via, :demo_shops_asked, :buyer_token_hash, 'open', :created_at)`),
    request: p('SELECT * FROM requests WHERE id = ?'),
    recent: p('SELECT * FROM requests WHERE (:status IS NULL OR status = :status) ORDER BY created_at DESC LIMIT :limit'),
    offersFor: p('SELECT o.*, s.name AS shop_name, s.shop_no, s.market, s.demo FROM offers o JOIN shops s ON s.id = o.shop_id WHERE o.request_id = ?'),
    insertOffer: p('INSERT INTO offers (request_id, shop_id, status, type, price_inr, warranty_days, ready_min, reveal_at, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)'),
    upsertOffer: p(`INSERT INTO offers (request_id, shop_id, status, type, price_inr, warranty_days, ready_min, reveal_at, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT (request_id, shop_id) DO UPDATE SET status = excluded.status, type = excluded.type, price_inr = excluded.price_inr, warranty_days = excluded.warranty_days, ready_min = excluded.ready_min, reveal_at = excluded.reveal_at, created_at = excluded.created_at`),
    myOffer: p('SELECT * FROM offers WHERE request_id = ? AND shop_id = ?'),
    reserve: p("UPDATE requests SET status = 'reserved', reserved_shop_id = ?, pickup_code = ?, part_price_inr = ?, fee_inr = ?, delivery_inr = ?, total_inr = ?, reserved_at = ? WHERE id = ? AND status = 'open'"),
    pay: p("UPDATE requests SET status = 'paid', paid_at = ?, payment_ref = ? WHERE id = ? AND status = 'reserved'"),
    cancel: p("UPDATE requests SET status = 'cancelled' WHERE id = ? AND status IN ('open', 'reserved')"),
    inbox: p(`SELECT * FROM requests WHERE status = 'open' AND created_at > ? AND (category = 'general' OR category IN (SELECT category FROM shop_categories WHERE shop_id = ?)) ORDER BY created_at DESC LIMIT 50`),
    orders: p("SELECT * FROM requests WHERE reserved_shop_id = ? AND status IN ('reserved', 'paid') ORDER BY reserved_at DESC LIMIT 50"),
    listings: p('SELECT name, market, address, sells, source_name, source_url FROM public_listings ORDER BY market, name'),
    facts: p('SELECT grp AS "group", stat, label, detail, source, url FROM facts ORDER BY id'),
    vehicles: p('SELECT id, year, make, model, trim FROM vehicles ORDER BY make, model, year'),
    carSearch: p(`SELECT DISTINCT p.id, p.part_number, p.name, p.description, p.brand, p.price, c.name AS category
      FROM car_parts p JOIN fitments f ON f.part_id = p.id JOIN vehicles v ON v.id = f.vehicle_id LEFT JOIN car_categories c ON c.id = p.category_id
      WHERE (:year IS NULL OR v.year = :year) AND (:make IS NULL OR v.make = :make) AND (:model IS NULL OR v.model = :model)
        AND (:pattern IS NULL OR p.name LIKE :pattern ESCAPE '\\' OR c.name LIKE :pattern ESCAPE '\\' OR p.part_number LIKE :pattern ESCAPE '\\')
      ORDER BY p.name, p.part_number`),
    fitsFor: p('SELECT v.id, v.year, v.make, v.model, v.trim FROM fitments f JOIN vehicles v ON v.id = f.vehicle_id WHERE f.part_id = ? ORDER BY v.make, v.model')
  };
}

function createApp(opts = {}) {
  const db = openDb(opts.dbFile || process.env.PURZA_DB || path.join(__dirname, '..', 'data', 'purza.db'));
  const now = opts.now || (() => Date.now());
  const corsOrigin = opts.corsOrigin || process.env.CORS_ORIGIN || '*';
  const allowIdentify = rateLimiter(opts.identifyPerMinute || Number(process.env.IDENTIFY_PER_MINUTE) || 6);
  const allowWrite = rateLimiter(opts.writesPerMinute || Number(process.env.WRITES_PER_MINUTE) || 60);
  const allowRead = rateLimiter(opts.readsPerMinute || Number(process.env.READS_PER_MINUTE) || 1200);
  const S = statements(db);
  const categoryCodes = S.categories.all().map(c => c.code);

  // ---------- views ----------
  const cats = s => (s && s.cats ? String(s.cats).split(',').filter(Boolean) : []);
  function priceRange(listings, pred) {
    const ps = listings.filter(pred).map(l => l.price_inr);
    return ps.length ? [Math.min(...ps), Math.max(...ps)] : null;
  }
  function partView(row, withListings = true) {
    const listings = S.listingsFor.all(row.id);
    const all = priceRange(listings, () => true);
    const out = {
      id: row.id, name: row.name, short_name: row.short_name, local_name: row.local_name, category: row.category, appliance: row.appliance,
      check: row.check_note, listed_price_inr: all ? { low: all[0], high: all[1] } : null,
      genuine_inr: priceRange(listings, l => l.kind === 'genuine'), compatible_inr: priceRange(listings, l => l.kind !== 'genuine'),
      listings_count: listings.length
    };
    if (withListings) out.listings = listings.map(l => ({ description: l.description, price_inr: l.price_inr, kind: l.kind, source: l.source_name, url: l.source_url, collected_on: l.collected_on }));
    return out;
  }
  // The shape the shared rules (logic.js) work on.
  function rulePart(partId, fallback) {
    const row = partId ? S.part.get(partId) : null;
    if (!row) return L.customPart(fallback || {});
    return { id: row.id, name: row.name, cat: row.category, obs: S.listingsFor.all(row.id).map(l => ({ price: l.price_inr, kind: l.kind })) };
  }
  function searchPartRows(q) {
    const t = String(q || '').toLowerCase();
    if (t.trim().length < 2) return [];
    const scored = [];
    for (const row of S.parts.all()) {
      let s = 0;
      for (const k of row.keywords.split('|').filter(Boolean)) if (t.includes(k.toLowerCase())) s += k.length;
      for (const w of [row.short_name, row.name, row.local_name]) if (w && w.toLowerCase().includes(t.trim())) s += 4;
      if (t.includes(row.short_name.toLowerCase())) s += 6;
      if (s > 0) scored.push({ row, s });
    }
    return scored.sort((a, b) => b.s - a.s).map(x => x.row);
  }
  function shopView(s) { return { id: s.id, name: s.name, shop_no: s.shop_no, market: s.market, demo: !!s.demo, categories: cats(s), created_at: s.created_at }; }
  function publicRequest(r, offerRows) {
    let reserved = null;
    if (r.reserved_shop_id) {
      const o = (offerRows || S.offersFor.all(r.id)).find(x => x.shop_id === r.reserved_shop_id) || {};
      const shop = S.shop.get(r.reserved_shop_id) || {};
      reserved = { shop_id: r.reserved_shop_id, shop: shop.name || '', shop_no: shop.shop_no || '', market: shop.market || '', demo: !!shop.demo, type: o.type || null, warranty_days: o.warranty_days ?? null, ready_in_min: o.ready_min ?? null, pickup_code: r.pickup_code, part_price_inr: r.part_price_inr, fee_inr: r.fee_inr, delivery_inr: r.delivery_inr, total_inr: r.total_inr, reserved_at: r.reserved_at };
    }
    return { id: r.id, part_id: r.part_id, part_name: r.part_name, category: r.category, local_name: r.local_name, appliance: r.appliance, check: r.check_note, persona: r.persona, prefer: r.prefer, delivery: r.delivery, area: r.area, sticker: r.sticker, note: r.note, max_price_inr: r.max_price_inr, via: r.via, status: r.status, created_at: r.created_at, reserved, paid_at: r.paid_at };
  }
  function requestView(r) {
    const t = now();
    const rows = S.offersFor.all(r.id);
    const visible = rows.filter(o => o.reveal_at <= t);
    const realAsked = S.realShopsFor.get({ cat: r.category }).n;
    const asked = r.demo_shops_asked + realAsked;
    const replies = visible.map(o => ({ shop_id: o.shop_id, shop: o.shop_name, shop_no: o.shop_no, market: o.market, demo: !!o.demo, status: o.status, type: o.type, price_inr: o.price_inr, warranty_days: o.warranty_days, ready_in_min: o.ready_min, replied_at: o.reveal_at }));
    const yes = replies.filter(x => x.status === 'yes');
    const within = yes.filter(x => r.max_price_inr == null || x.price_inr <= r.max_price_inr);
    const ranked = L.rankOffers(within.map(x => Object.assign({}, x, { price: x.price_inr, warranty: x.warranty_days, ready: x.ready_in_min })), r.prefer);
    const part = rulePart(r.part_id, { part_name: r.part_name, category: r.category });
    return {
      request: publicRequest(r, rows),
      summary: { shops_asked: asked, have_it: yes.length, dont_have: replies.length - yes.length, yet_to_reply: Math.max(0, asked - replies.length), still_arriving: rows.length - visible.length },
      offers: ranked.map((x, i) => ({ shop_id: x.shop_id, shop: x.shop, shop_no: x.shop_no, market: x.market, demo: x.demo, type: x.type, price_inr: x.price_inr, warranty_days: x.warranty_days, ready_in_min: x.ready_in_min, price_check: L.fairCheck(part, x.type, x.price_inr), best: i === 0 })),
      best_reason: ranked.length ? L.bestReason(ranked[0], ranked, r.prefer) : null,
      over_budget: yes.length - within.length,
      fees_if_best: ranked.length ? L.totals(ranked[0].price, r.persona, r.delivery) : null,
      replies
    };
  }
  function inboxCard(r, shopId) {
    const t = now();
    const rows = S.offersFor.all(r.id);
    const mine = rows.find(o => o.shop_id === shopId);
    const part = r.part_id ? S.part.get(r.part_id) : null;
    const pv = part ? partView(part, false) : null;
    return Object.assign(publicRequest(r, rows), {
      listed_price_inr: pv ? pv.listed_price_inr : null,
      suggested_prices: { genuine: L.suggestPrices(rulePart(r.part_id, { part_name: r.part_name, category: r.category }), 'genuine'), compatible: L.suggestPrices(rulePart(r.part_id, { part_name: r.part_name, category: r.category }), 'compatible') },
      replies_count: rows.filter(o => o.reveal_at <= t).length,
      my_offer: mine ? { status: mine.status, type: mine.type, price_inr: mine.price_inr, warranty_days: mine.warranty_days, ready_in_min: mine.ready_min } : null
    });
  }

  // ---------- auth helpers ----------
  function shopFromToken(req) {
    const tok = bearer(req);
    if (!tok) fail(401, 'Send your shop token as "Authorization: Bearer <token>"');
    const s = S.shopByToken.get(hashToken(tok));
    if (!s) fail(403, 'Unknown shop token');
    return s;
  }
  function buyerRequest(req, id) {
    if (!ID_RE.req.test(id)) fail(404, 'No such request');
    const r = S.request.get(id);
    if (!r) fail(404, 'No such request');
    const tok = bearer(req);
    if (!tok) fail(401, 'Send the buyer token from POST /api/requests as "Authorization: Bearer <token>"');
    if (!sameHash(hashToken(tok), r.buyer_token_hash)) fail(403, 'This token does not own the request');
    return r;
  }

  // ---------- handlers ----------
  const routes = [];
  const route = (method, pattern, fn) => routes.push({ method, re: new RegExp('^' + pattern.replace(/:(\w+)/g, '(?<$1>[^/]+)') + '$'), fn });

  route('GET', '/api', () => ({
    name: 'Purza API', docs: '/llms.txt',
    endpoints: ['GET /api/health', 'POST /api/identify', 'GET /api/categories', 'GET /api/parts?q=&category=', 'GET /api/parts/:id', 'GET /api/listings', 'GET /api/facts', 'GET /api/shops', 'POST /api/shops', 'GET /api/shop/inbox', 'POST /api/requests', 'GET /api/requests?status=open', 'GET /api/requests/:id', 'POST /api/requests/:id/offers', 'POST /api/requests/:id/reserve', 'POST /api/requests/:id/pay', 'POST /api/requests/:id/cancel', 'GET /api/vehicles', 'GET /api/search?part=&year=&make=&model=']
  }));
  route('GET', '/api/health', () => ({ ok: true, time: new Date(now()).toISOString(), payments: payments.MODE, ai: photoCheck.provider() }));
  route('POST', '/api/identify', ({ body }) => photoCheck.identify(body, opts.identifyFetch || fetch));
  route('GET', '/api/categories', () => ({ appliance: S.categories.all(), car: S.carCategories.all() }));
  route('GET', '/api/parts', ({ query }) => {
    const q = str(query.get('q'), 80, 'q');
    const cat = oneOf(query.get('category') || null, categoryCodes, 'category', null);
    let rows = q ? searchPartRows(q) : S.parts.all();
    if (cat) rows = rows.filter(r => r.category === cat);
    return { count: rows.length, parts: rows.map(r => partView(r)) };
  });
  route('GET', '/api/parts/:id', ({ params }) => {
    const row = /^[a-z0-9-]{2,40}$/.test(params.id) ? S.part.get(params.id) : null;
    if (!row) fail(404, 'No such part');
    return partView(row);
  });
  route('GET', '/api/listings', () => ({ note: 'Real businesses from public directories. Not Purza partners.', listings: S.listings.all() }));
  route('GET', '/api/facts', () => ({ facts: S.facts.all() }));
  route('GET', '/api/shops', () => ({ shops: S.shops.all().map(shopView) }));
  route('POST', '/api/shops', ({ body }) => {
    const o = { name: str(body.name, 60, 'name', { required: true, min: 2 }), shop_no: str(body.shop_no, 20, 'shop_no'), market: body.market, cats: Array.isArray(body.categories) ? [...new Set(body.categories)] : [] };
    const err = L.validateShop({ name: o.name, market: o.market, cats: o.cats });
    if (err) fail(400, err);
    const id = newId('shop'), token = newToken(), t = now();
    tx(db, () => { S.insertShop.run(id, o.name, o.shop_no, o.market, hashToken(token), t); for (const c of o.cats) S.insertShopCat.run(id, c); });
    return { status: 201, body: { shop: shopView(S.shop.get(id)), shop_token: token, note: 'Keep the token secret: it is the only way to reply as this shop.' } };
  });
  route('GET', '/api/shop/inbox', ({ req }) => {
    const s = shopFromToken(req);
    return {
      shop: shopView(s),
      open: S.inbox.all(now() - INBOX_DAYS * 864e5, s.id).map(r => inboxCard(r, s.id)),
      orders: S.orders.all(s.id).map(r => inboxCard(r, s.id))
    };
  });
  route('POST', '/api/requests', ({ body }) => {
    let partRow = null, part;
    if (body.part_id != null && body.part_id !== '') {
      partRow = typeof body.part_id === 'string' && /^[a-z0-9-]{2,40}$/.test(body.part_id) ? S.part.get(body.part_id) : null;
      if (!partRow) fail(400, 'Unknown part_id. Use GET /api/parts?q=... to find it, or send part_name instead.');
      part = rulePart(partRow.id);
    } else {
      const name = str(body.part_name, 80, 'part_name', { required: true, min: 3 });
      part = L.customPart({ part_name: name, category: oneOf(body.category || 'general', categoryCodes, 'category', 'general') });
    }
    const id = newId('req'), token = newToken(), t = now();
    const includeDemo = body.include_demo !== false;
    const row = {
      id, part_id: partRow ? partRow.id : null, part_name: partRow ? partRow.name : part.name, category: partRow ? partRow.category : part.cat,
      local_name: partRow ? partRow.local_name : '', appliance: partRow ? partRow.appliance : '', check_note: partRow ? partRow.check_note : part.check,
      persona: oneOf(body.persona, ['tech', 'home'], 'persona', 'home'), prefer: oneOf(body.prefer, ['genuine', 'cheap', 'fast'], 'prefer', 'genuine'),
      delivery: oneOf(body.delivery, ['pickup', 'deliver'], 'delivery', 'pickup'), area: str(body.area, 40, 'area'), sticker: str(body.sticker, 60, 'sticker'),
      note: str(body.note, 200, 'note'), max_price_inr: intOrNull(body.max_price_inr, 1, 500000, 'max_price_inr'), via: oneOf(body.via, ['person', 'agent'], 'via', 'person'),
      demo_shops_asked: includeDemo ? L.D.DEMO_SHOPS.length : 0, buyer_token_hash: hashToken(token), created_at: t
    };
    tx(db, () => {
      S.insertRequest.run(row);
      if (includeDemo) for (const d of L.makeDemoReplies(part, id)) {
        if (d.status === 'none') continue;
        const at = t + Math.round(d.afterSec * 1000);
        if (d.status === 'yes') S.insertOffer.run(id, d.shopId, 'yes', d.type, d.price, d.warranty, d.ready, at, t);
        else S.insertOffer.run(id, d.shopId, 'no', null, null, null, null, at, t);
      }
    });
    return { status: 201, body: Object.assign({ buyer_token: token, note: 'Keep buyer_token: it is needed to reserve, pay or cancel. Replies arrive over about a minute; poll GET /api/requests/' + id + '.' }, requestView(S.request.get(id))) };
  });
  route('GET', '/api/requests', ({ query }) => {
    const status = oneOf(query.get('status') || null, ['open', 'reserved', 'paid', 'cancelled'], 'status', null);
    const limit = intOrNull(query.get('limit'), 1, 100, 'limit') || 30;
    return { requests: S.recent.all({ status, limit }).map(r => publicRequest(r)) };
  });
  route('GET', '/api/requests/:id', ({ params }) => {
    const r = ID_RE.req.test(params.id) ? S.request.get(params.id) : null;
    if (!r) fail(404, 'No such request');
    return requestView(r);
  });
  route('POST', '/api/requests/:id/offers', ({ req, params, body }) => {
    const s = shopFromToken(req);
    const r = ID_RE.req.test(params.id) ? S.request.get(params.id) : null;
    if (!r) fail(404, 'No such request');
    if (r.status !== 'open') fail(409, 'This request is ' + r.status + ' and takes no more offers');
    const status = oneOf(body.status, ['yes', 'no'], 'status', null);
    if (!status) fail(400, 'status is required: "yes" or "no"');
    const offer = status === 'no' ? { status } : { status, type: body.type, price: Number(body.price_inr), warranty: Number(body.warranty_days ?? 0), ready: Number(body.ready_in_min ?? 10) };
    const err = L.validateOffer(offer);
    if (err) fail(400, err);
    const t = now();
    if (status === 'yes') S.upsertOffer.run(r.id, s.id, 'yes', offer.type, offer.price, offer.warranty, offer.ready, t, t);
    else S.upsertOffer.run(r.id, s.id, 'no', null, null, null, null, t, t);
    const mine = S.myOffer.get(r.id, s.id);
    return { status: 201, body: { ok: true, my_offer: { status: mine.status, type: mine.type, price_inr: mine.price_inr, warranty_days: mine.warranty_days, ready_in_min: mine.ready_min }, price_check: status === 'yes' ? L.fairCheck(rulePart(r.part_id, { part_name: r.part_name, category: r.category }), offer.type, offer.price) : null } };
  });
  route('POST', '/api/requests/:id/reserve', ({ req, params, body }) => {
    const r = buyerRequest(req, params.id);
    if (r.status !== 'open') fail(409, 'This request is already ' + r.status);
    const shopId = typeof body.shop_id === 'string' && ID_RE.shop.test(body.shop_id) ? body.shop_id : fail(400, 'shop_id is required');
    const o = S.offersFor.all(r.id).find(x => x.shop_id === shopId && x.status === 'yes' && x.reveal_at <= now());
    if (!o) fail(409, 'That shop has not offered this part');
    const t = L.totals(o.price_inr, r.persona, r.delivery);
    const code = L.pickupCode(r.id, shopId);
    const payment = payments.createPaymentLink({ requestId: r.id, amountInr: t.total, description: r.part_name + ' from ' + o.shop_name });
    const res = S.reserve.run(shopId, code, t.part, t.fee, t.delivery, t.total, now(), r.id);
    if (res.changes !== 1) fail(409, 'This request changed; reload it');
    return Object.assign({ payment, hold_minutes: 30 }, requestView(S.request.get(r.id)));
  });
  route('POST', '/api/requests/:id/pay', ({ req, params }) => {
    const r = buyerRequest(req, params.id);
    if (r.status !== 'reserved') fail(409, r.status === 'paid' ? 'Already paid' : 'Reserve an offer first');
    const ref = payments.confirmDemoPayment(r.id);
    if (S.pay.run(now(), ref, r.id).changes !== 1) fail(409, 'This request changed; reload it');
    return requestView(S.request.get(r.id));
  });
  route('POST', '/api/requests/:id/cancel', ({ req, params }) => {
    const r = buyerRequest(req, params.id);
    if (S.cancel.run(r.id).changes !== 1) fail(409, 'This request is already ' + r.status);
    return requestView(S.request.get(r.id));
  });
  route('GET', '/api/vehicles', () => ({ note: 'Sample catalogue for the car-parts preview.', vehicles: S.vehicles.all() }));
  route('GET', '/api/search', ({ query }) => {
    const part = str(query.get('part'), 60, 'part');
    const params = {
      year: intOrNull(query.get('year'), 1950, 2100, 'year'),
      make: str(query.get('make'), 40, 'make') || null,
      model: str(query.get('model'), 40, 'model') || null,
      pattern: part ? '%' + part.replace(/[\\%_]/g, '\\$&') + '%' : null
    };
    const rows = S.carSearch.all(params).map(p => Object.assign({}, p, { fits: S.fitsFor.all(p.id) }));
    return { count: rows.length, note: 'Sample catalogue: part numbers are placeholders and prices are not set.', parts: rows };
  });

  // ---------- plumbing ----------
  function send(res, status, body, extra = {}) {
    const payload = typeof body === 'string' ? body : JSON.stringify(body);
    res.writeHead(status, Object.assign({ 'Content-Type': typeof body === 'string' ? 'text/plain; charset=utf-8' : 'application/json; charset=utf-8', 'Cache-Control': 'no-store' }, SECURITY_HEADERS, extra));
    res.end(payload);
  }
  function readBody(req, max = MAX_BODY) {
    return new Promise((resolve, reject) => {
      if (req.method !== 'POST') return resolve({});
      if (!/^application\/json\b/i.test(req.headers['content-type'] || '')) return reject(new HttpError(415, 'Send JSON with Content-Type: application/json'));
      let size = 0, tooBig = false; const chunks = [];
      req.on('data', c => {
        if (tooBig) return; // keep draining, but stop storing
        size += c.length;
        if (size > max) { tooBig = true; chunks.length = 0; reject(new HttpError(413, 'Body too large')); } else chunks.push(c);
      });
      req.on('end', () => {
        if (tooBig) return;
        if (!chunks.length) return resolve({});
        try { const v = JSON.parse(Buffer.concat(chunks).toString('utf8')); if (!v || typeof v !== 'object' || Array.isArray(v)) throw new Error(); resolve(v); }
        catch (e) { reject(new HttpError(400, 'Body must be a JSON object')); }
      });
      req.on('error', reject);
    });
  }
  function serveStatic(req, res, pathname) {
    if (pathname === '/llms.txt') return send(res, 200, llmsTxt(), { 'Content-Type': 'text/plain; charset=utf-8', 'Cache-Control': 'public, max-age=300' });
    let rel;
    try { rel = decodeURIComponent(pathname); } catch (e) { return send(res, 400, { error: 'Bad path' }); }
    if (rel === '/' || rel === '') rel = '/index.html';
    const file = path.resolve(PUBLIC_DIR, '.' + rel);
    if (!file.startsWith(PUBLIC_DIR + path.sep)) return send(res, 404, { error: 'Not found' });
    fs.stat(file, (err, st) => {
      if (err || !st.isFile()) return send(res, 404, { error: 'Not found' });
      res.writeHead(200, Object.assign({ 'Content-Type': TYPES[path.extname(file)] || 'application/octet-stream', 'Cache-Control': 'public, max-age=60' }, SECURITY_HEADERS));
      if (req.method === 'HEAD') return res.end();
      fs.createReadStream(file).pipe(res);
    });
  }
  async function handle(req, res) {
    const url = new URL(req.url, 'http://localhost');
    const ip = req.socket.remoteAddress || 'unknown';
    if (!url.pathname.startsWith('/api/') && url.pathname !== '/api') {
      if (req.method !== 'GET' && req.method !== 'HEAD') return send(res, 405, { error: 'Method not allowed' });
      return serveStatic(req, res, url.pathname);
    }
    const cors = { 'Access-Control-Allow-Origin': corsOrigin, 'Access-Control-Allow-Headers': 'Content-Type, Authorization', 'Access-Control-Allow-Methods': 'GET, POST, OPTIONS', 'Vary': 'Origin' };
    if (req.method === 'OPTIONS') { res.writeHead(204, Object.assign(cors, SECURITY_HEADERS)); return res.end(); }
    if (url.pathname === '/api/identify' && req.method === 'POST' && !allowIdentify(ip)) return send(res, 429, { error: 'Too many photo checks. Wait a minute, or pick the part from the list.' }, Object.assign({ 'Retry-After': '60' }, cors));
    if (!(req.method === 'GET' ? allowRead(ip) : allowWrite(ip))) return send(res, 429, { error: 'Too many requests. Wait a minute.' }, Object.assign({ 'Retry-After': '60' }, cors));
    for (const r of routes) {
      if (r.method !== req.method) continue;
      const m = r.re.exec(url.pathname);
      if (!m) continue;
      try {
        const body = await readBody(req, url.pathname === '/api/identify' ? MAX_PHOTO_BODY : MAX_BODY);
        const out = await r.fn({ req, params: m.groups || {}, query: url.searchParams, body });
        if (out && out.status && out.body) return send(res, out.status, out.body, cors);
        return send(res, 200, out, cors);
      } catch (e) {
        if (e instanceof HttpError || (e && e.status)) return send(res, e.status, { error: e.message }, e.status === 413 ? Object.assign({ Connection: 'close' }, cors) : cors);
        console.error(e);
        return send(res, 500, { error: 'Something went wrong' }, cors);
      }
    }
    const known = routes.some(r => r.re.test(url.pathname));
    return send(res, known ? 405 : 404, { error: known ? 'Method not allowed' : 'Not found' }, cors);
  }

  const server = http.createServer((req, res) => { handle(req, res).catch(e => { console.error(e); if (!res.headersSent) send(res, 500, { error: 'Something went wrong' }); }); });
  server.db = db;
  return server;
}

function llmsTxt() {
  return `# Purza
> Purza asks every appliance spare-parts shop in Mumbai's Lohar Chawl and Lamington Road markets at once. Shops reply with price, genuine or compatible, warranty and ready time. A buyer (or an AI agent acting for one) reserves the best offer and pays by UPI.

## For AI agents
1. Find the part: GET /api/parts?q=geyser%20not%20heating  -> parts[].id, prices listed online, what shops must check
2. Ask the market: POST /api/requests  {"part_id":"geyser-element","persona":"home","prefer":"genuine","delivery":"deliver","area":"Andheri West","max_price_inr":700,"via":"agent"}
   -> {"request":{"id":...},"buyer_token":...}. Keep buyer_token.
3. Read offers: GET /api/requests/{id}  (poll every few seconds for about a minute; offers[] is ranked best first, each with price_check)
4. Reserve: POST /api/requests/{id}/reserve  {"shop_id":"..."} with header "Authorization: Bearer {buyer_token}"
   -> pickup_code, fees, total, and a UPI payment link (demo mode: no money moves)

## Rules
- Prefer genuine parts unless the buyer asks for cheapest or fastest. Respect the buyer's budget.
- Do not reserve an offer whose price_check.flag is "high" without asking the buyer.
- Fees: households pay Rs 29 for parts under Rs 500 and Rs 49 above; nothing if no shop has it. Delivery Rs 60. Technicians on Purza Pro pay no per-order fee.

## Other endpoints
- GET /api/listings: real shops from public listings (not Purza partners)
- GET /api/facts: market facts with sources
- GET /api/search?part=brake&year=2021&make=Maruti%20Suzuki&model=Swift: car parts preview (sample catalogue)
`;
}

if (require.main === module) {
  const port = Number(process.env.PORT) || 3000;
  const server = createApp();
  server.listen(port, () => console.log('Purza is running at http://localhost:' + port + '  (API: /api, agent guide: /llms.txt)'));
  const stop = () => { server.close(() => { try { server.db.close(); } catch (e) { /* already closed */ } process.exit(0); }); };
  process.on('SIGINT', stop); process.on('SIGTERM', stop);
}

module.exports = { createApp };
