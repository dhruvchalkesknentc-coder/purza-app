'use strict';
/* Purza business rules: fees, ranking, price checks, demo-shop replies, part search.
   Kept identical to the logic in the hosted Purza site, so the website and the API give the same answers. */
const D = require('../data/data.js');
const FEES = D.FEES;
const PART_BY_ID = Object.fromEntries(D.PARTS.map(p => [p.id, p]));
const DEMO_BY_ID = Object.fromEntries(D.DEMO_SHOPS.map(s => [s.id, s]));
const CAT_LIST = Object.keys(D.CATEGORIES);
const MARKETS = D.AREAS.map(a => a.name).concat(['Other Mumbai']);
const CAT_SHORT = { ac: 'AC', fan: 'FAN', mixer: 'MIX', washer: 'WM', geyser: 'GYS', fridge: 'FRG', general: 'PART' };

function inr(n) { return '₹' + Math.round(Number(n) || 0).toLocaleString('en-IN'); }
function clip(s, n) { return String(s == null ? '' : s).trim().slice(0, n); }
function hashStr(s) { let h = 2166136261; for (const c of String(s)) { h ^= c.charCodeAt(0); h = Math.imul(h, 16777619); } return h >>> 0; }
function mulberry(a) { return function () { a |= 0; a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
function round1(x) { return Math.round(x * 10) / 10; }
function roundPrice(p) { if (p < 100) return Math.round(p); if (p < 1000) return Math.round(p / 5) * 5; return Math.round(p / 10) * 10; }
function householdFee(price) { return price < FEES.smallBelow ? FEES.householdSmall : FEES.householdLarge; }
function minMax(a) { return a.length ? [Math.min(...a), Math.max(...a)] : null; }

function priceStats(part) {
  const obs = (part && part.obs) || [];
  return {
    all: minMax(obs.map(o => o.price)),
    genuine: minMax(obs.filter(o => o.kind === 'genuine').map(o => o.price)),
    compatible: minMax(obs.filter(o => o.kind !== 'genuine').map(o => o.price)),
    count: obs.length
  };
}
// Price bands the demo shops quote from: the listed prices, filled in where a kind has no listing.
function demoBands(part) {
  const s = priceStats(part);
  let g = s.genuine, c = s.compatible;
  if (!g && !c && part && part.estimate) { g = part.estimate.genuine; c = part.estimate.compatible; }
  if (!g && c) g = [c[1], roundPrice(c[1] * 1.1)];
  if (!c && g) c = [roundPrice(g[0] * 0.5), roundPrice(g[0] * 0.75)];
  if (!g && !c) { g = [300, 500]; c = [150, 260]; }
  return { genuine: g, compatible: c };
}
function shopFits(shop, cat) { return cat === 'general' || (Array.isArray(shop.cats) && shop.cats.includes(cat)); }

// Each demo shop's reply to one request: deterministic from the request id, revealed afterSec seconds after it is posted.
function makeDemoReplies(part, seed) {
  const rnd = mulberry(hashStr(String(seed) + '|' + part.id));
  const bands = demoBands(part);
  const genShare = part.obs && part.obs.some(o => o.kind === 'genuine') ? 0.5 : 0.3;
  const out = D.DEMO_SHOPS.map(s => {
    const fit = part.cat === 'general' ? rnd() < 0.5 : shopFits(s, part.cat);
    const r = rnd();
    if ((fit && r < 0.62) || (!fit && r < 0.06)) {
      const gen = rnd() < genShare;
      const b = gen ? bands.genuine : bands.compatible;
      return {
        shopId: s.id, status: 'yes', type: gen ? 'genuine' : 'compatible',
        price: Math.max(10, roundPrice(b[0] + (b[1] - b[0]) * rnd())),
        warranty: gen ? (rnd() < 0.5 ? 90 : 180) : [7, 15, 30][Math.floor(rnd() * 3)],
        ready: [5, 10, 15, 20][Math.floor(rnd() * 4)],
        afterSec: round1(4 + rnd() * 36)
      };
    }
    if (r < 0.88) return { shopId: s.id, status: 'no', afterSec: round1(3 + rnd() * 30) };
    return { shopId: s.id, status: 'none' };
  });
  if (!out.some(o => o.status === 'yes')) {
    const i = Math.max(0, D.DEMO_SHOPS.findIndex(s => shopFits(s, part.cat)));
    const b = bands.compatible;
    out[i] = { shopId: D.DEMO_SHOPS[i].id, status: 'yes', type: 'compatible', price: roundPrice((b[0] + b[1]) / 2), warranty: 15, ready: 10, afterSec: 9 };
  }
  return out;
}

function num(x, lo, hi) { const n = Number(x); return Number.isFinite(n) && n >= lo && n <= hi ? n : null; }
// A real shop's reply as stored under offers.<shopId>; shared data is untrusted, so every field is checked.
function cleanOffer(id, o) {
  if (!o || typeof o !== 'object') return null;
  const status = o.status === 'yes' ? 'yes' : o.status === 'no' ? 'no' : null;
  if (!status) return null;
  const base = { shopId: String(id), name: clip(o.name, 60) || 'Shop', shopNo: clip(o.shopNo, 20), market: clip(o.market, 30), demo: false, status, at: num(o.at, 0, 1e14) || 0 };
  if (status === 'no') return base;
  const price = num(o.price, 1, 500000);
  if (price == null) return null;
  return Object.assign(base, { type: o.type === 'genuine' ? 'genuine' : 'compatible', price: Math.round(price), warranty: num(o.warranty, 0, 3650) || 0, ready: num(o.ready, 0, 1440) || 0 });
}
function collectOffers(req, now) {
  const t0 = num(req.createdAt, 0, 1e14) || 0;
  const all = [];
  let waiting = 0, pending = 0, demoAsked = 0;
  for (const r of Array.isArray(req.demoReplies) ? req.demoReplies : []) {
    const shop = DEMO_BY_ID[r && r.shopId];
    if (!shop) continue;
    demoAsked++;
    if (r.status !== 'yes' && r.status !== 'no') { waiting++; continue; }
    const at = t0 + (num(r.afterSec, 0, 600) || 0) * 1000;
    if (at > now) { waiting++; pending++; continue; }
    const o = { shopId: shop.id, name: shop.name, shopNo: shop.shopNo, market: shop.market, demo: true, status: r.status, at };
    if (r.status === 'yes') Object.assign(o, { type: r.type === 'genuine' ? 'genuine' : 'compatible', price: num(r.price, 1, 500000) || 0, warranty: num(r.warranty, 0, 3650) || 0, ready: num(r.ready, 0, 1440) || 0 });
    all.push(o);
  }
  let real = 0;
  const offers = req.offers && typeof req.offers === 'object' ? req.offers : {};
  for (const id of Object.keys(offers)) { const o = cleanOffer(id, offers[id]); if (o) { all.push(o); real++; } }
  return { all, yes: all.filter(o => o.status === 'yes' && o.price > 0), no: all.filter(o => o.status === 'no'), waiting, pending, demoAsked, real };
}
function rankOffers(offers, prefer) {
  const o = offers.slice();
  const g = x => (x.type === 'genuine' ? 0 : 1);
  if (prefer === 'cheap') o.sort((a, b) => a.price - b.price || g(a) - g(b) || a.ready - b.ready);
  else if (prefer === 'fast') o.sort((a, b) => a.ready - b.ready || a.price - b.price);
  else o.sort((a, b) => g(a) - g(b) || a.price - b.price || b.warranty - a.warranty);
  return o;
}
function bestReason(best, offers, prefer) {
  if (!best) return '';
  const gen = offers.filter(o => o.type === 'genuine');
  if (prefer === 'cheap') return 'Lowest price of ' + offers.length + (offers.length === 1 ? ' offer' : ' offers');
  if (prefer === 'fast') return 'Ready soonest, in ' + best.ready + ' min';
  if (best.type === 'genuine') return gen.length > 1 ? 'Cheapest of ' + gen.length + ' genuine offers' : 'The only genuine offer';
  return 'No genuine part offered; best compatible one';
}
function totals(price, persona, delivery) {
  const fee = persona === 'tech' ? 0 : householdFee(price);
  const del = delivery === 'deliver' ? FEES.delivery : 0;
  return { part: price, fee, delivery: del, total: price + fee + del };
}
function pickupCode(rid, shopId) { let h = 7; for (const c of String(rid) + '|' + shopId) h = (h * 31 + c.charCodeAt(0)) % 9000; return 'PZ-' + (1000 + h); }
function fairCheck(part, type, price) {
  if (!part || !part.obs || !part.obs.length) return null;
  const s = priceStats(part);
  const [lo, hi] = s.all;
  if (price > hi * 1.15) return { flag: 'high', text: 'Above prices listed online (' + inr(lo) + '–' + inr(hi) + ')' };
  const gLo = s.genuine ? s.genuine[0] : lo;
  if (type === 'genuine' && price < gLo * 0.6) return { flag: 'low', text: 'Far below listed genuine prices: ask to see the brand label' };
  return { flag: 'ok', text: 'In line with listed prices' };
}
function searchParts(text) {
  const t = String(text || '').toLowerCase();
  if (t.trim().length < 3) return [];
  const scored = [];
  for (const p of D.PARTS) {
    let s = 0;
    for (const k of p.keywords) if (t.includes(k.toLowerCase())) s += k.length;
    if (t.includes(p.short.toLowerCase())) s += 6;
    if (s > 0) scored.push({ part: p, score: s });
  }
  return scored.sort((a, b) => b.score - a.score).map(x => x.part);
}
function matchPartFromText(text) { const r = searchParts(text); return r.length ? r[0].id : null; }
function customPart(info) {
  const cat = CAT_LIST.includes(info.category) ? info.category : 'general';
  const name = clip(info.part_name || info.name, 80) || 'Spare part';
  const band = b => Array.isArray(b) && b.length === 2 && b.every(n => typeof n === 'number' && isFinite(n) && n > 0 && n < 200000) ? [Math.min(b[0], b[1]), Math.max(b[0], b[1])] : null;
  const g = band(info.genuine_price_inr), c = band(info.compatible_price_inr);
  return { id: 'custom', name, short: name, cat, local: clip(info.local_name, 60), appliance: clip(info.appliance, 80), check: clip(info.check, 200) || 'Shops match it from the photo and the description.', keywords: [], obs: [], estimate: (g || c) ? { genuine: g, compatible: c } : null };
}
function buildRequestDoc(o) {
  const p = o.part;
  const max = num(o.maxPrice, 1, 500000);
  return {
    partId: p.id, partName: p.name, cat: p.cat, local: p.local || '', appliance: p.appliance || '', check: p.check || '',
    sticker: clip(o.sticker, 60), note: clip(o.note, 200), area: clip(o.area, 40),
    persona: o.persona === 'home' ? 'home' : 'tech',
    prefer: ['genuine', 'cheap', 'fast'].includes(o.prefer) ? o.prefer : 'genuine',
    delivery: o.delivery === 'deliver' ? 'deliver' : 'pickup',
    maxPrice: max == null ? null : Math.round(max),
    via: o.via === 'agent' ? 'agent' : 'person',
    photoId: o.photoId || null, aiIdentified: !!o.aiIdentified,
    buyerId: String(o.buyerId), createdAt: o.now, status: 'open',
    demoReplies: o.includeDemo ? makeDemoReplies(p, o.rid) : [],
    offers: {}, reserved: null, paidAt: null
  };
}
function validateOffer(o) {
  if (o.status === 'no') return null;
  if (o.type !== 'genuine' && o.type !== 'compatible') return 'Choose genuine or compatible.';
  if (!Number.isInteger(o.price) || o.price < 1 || o.price > 500000) return 'Enter the price in rupees.';
  if (!Number.isInteger(o.warranty) || o.warranty < 0 || o.warranty > 3650) return 'Warranty must be 0 to 3650 days.';
  if (!Number.isInteger(o.ready) || o.ready < 0 || o.ready > 1440) return 'Ready time must be 0 to 1440 minutes.';
  return null;
}
function validateShop(o) {
  if (clip(o.name, 60).length < 2) return 'Enter the shop name.';
  if (!MARKETS.includes(o.market)) return 'Choose the market.';
  if (!Array.isArray(o.cats) || !o.cats.length || !o.cats.every(c => CAT_LIST.includes(c))) return 'Tick at least one kind of part you stock.';
  return null;
}
function suggestPrices(part, type) {
  const b = demoBands(part)[type];
  const mid = roundPrice((b[0] + b[1]) / 2);
  return [...new Set([roundPrice(b[0]), mid, roundPrice(b[1])])];
}
function carSearch(q) {
  const vs = D.CAR_VEHICLES.filter(v => (!q.year || v.year === Number(q.year)) && (!q.make || v.make === q.make) && (!q.model || v.model === q.model));
  const ids = new Set(vs.map(v => v.id));
  const qq = String(q.part || '').toLowerCase().trim();
  return D.CAR_PARTS
    .filter(p => p.fits.some(id => ids.has(id)) && (!qq || (p.name + ' ' + p.category + ' ' + p.part_number).toLowerCase().includes(qq)))
    .map(p => Object.assign({}, p, { vehicles: p.fits.filter(id => ids.has(id)).map(id => D.CAR_VEHICLES.find(v => v.id === id)) }));
}
function timeAgo(ms, now) {
  const s = Math.max(0, Math.round((now - ms) / 1000));
  if (s < 45) return 'just now';
  const m = Math.round(s / 60); if (m < 60) return m + ' min ago';
  const h = Math.round(m / 60); if (h < 24) return h + ' h ago';
  return Math.round(h / 24) + ' d ago';
}

// Mumbai areas: match what a buyer types ("Andheri West", "kandivli", "Mira Rd E") to an area.
function normArea(t) { return ' ' + String(t || '').toLowerCase().replace(/\brd\b/g, 'road').replace(/[^a-z]+/g, ' ').replace(/\b(east|west|e|w|mumbai|station)\b/g, ' ').replace(/\s+/g, ' ').trim() + ' '; }
function findArea(text) {
  const t = normArea(text);
  if (t.trim().length < 3) return null;
  const names = a => [a.name].concat(a.aka || []).map(normArea);
  return D.AREAS.find(a => names(a).includes(t))
    || D.AREAS.find(a => names(a).some(n => t.includes(n)))
    || D.AREAS.find(a => names(a).some(n => n.trim().startsWith(t.trim())))
    || null;
}
// Shops near a buyer: public listings (and any extra shops passed in) in the same area, else the rest of that zone.
function shopsNear(text, extra) {
  const area = findArea(text);
  if (!area) return null;
  const all = D.PUBLIC_LISTINGS.concat(extra || []);
  const here = all.filter(l => (l.area || l.market) === area.name);
  if (here.length) return { area, exact: true, shops: here };
  const zone = all.filter(l => (l.zone || (D.AREAS.find(a => a.name === (l.area || l.market)) || {}).zone) === area.zone);
  return { area, exact: false, shops: zone };
}

module.exports = { D, FEES, PART_BY_ID, DEMO_BY_ID, CAT_LIST, MARKETS, inr, clip, num, householdFee, priceStats, demoBands, shopFits, makeDemoReplies, rankOffers, bestReason, totals, pickupCode, fairCheck, searchParts, matchPartFromText, customPart, validateOffer, validateShop, suggestPrices, carSearch, timeAgo, findArea, shopsNear };
