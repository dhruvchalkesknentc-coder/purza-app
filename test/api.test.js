'use strict';
// API tests: npm test   (uses an in-memory database and a controllable clock)
const test = require('node:test');
const assert = require('node:assert');
const { createApp } = require('../src/server.js');

let clock = 1_800_000_000_000;
let app, base;
test.before(async () => {
  app = createApp({ dbFile: ':memory:', now: () => clock, writesPerMinute: 10000 });
  await new Promise(r => app.listen(0, '127.0.0.1', r));
  base = 'http://127.0.0.1:' + app.address().port;
});
test.after(() => { app.close(); app.db.close(); });

async function call(method, path, body, token, headers = {}) {
  const h = Object.assign({}, headers);
  if (body !== undefined) h['Content-Type'] = h['Content-Type'] || 'application/json';
  if (token) h.Authorization = 'Bearer ' + token;
  const r = await fetch(base + path, { method, headers: h, body: body === undefined ? undefined : (typeof body === 'string' ? body : JSON.stringify(body)) });
  const text = await r.text();
  let json = null; try { json = JSON.parse(text); } catch (e) { /* not JSON */ }
  return { status: r.status, body: json, text, headers: r.headers };
}

test('health, categories and seeded reference data', async () => {
  assert.strictEqual((await call('GET', '/api/health')).body.ok, true);
  const cats = (await call('GET', '/api/categories')).body;
  assert.ok(cats.appliance.some(c => c.code === 'ac'));
  const parts = (await call('GET', '/api/parts')).body;
  assert.strictEqual(parts.count, 15);
  assert.ok(parts.parts.every(p => p.listings.every(l => /^https?:\/\//.test(l.url))));
  const lst = (await call('GET', '/api/listings')).body;
  assert.strictEqual(lst.listings.length, 72);
  assert.ok(lst.areas.length >= 60 && lst.zones.includes('Western Suburbs'));
  const kand = (await call('GET', '/api/listings?area=' + encodeURIComponent('Kandivali West'))).body;
  assert.ok(kand.near.exact && kand.near.area === 'Kandivali' && kand.listings.length >= 2 && kand.listings.every(l => l.area === 'Kandivali'));
  const bandra = (await call('GET', '/api/listings?area=Bandra')).body;
  assert.ok(!bandra.near.exact && bandra.listings.length > 0 && bandra.listings.every(l => l.zone === 'Western Suburbs'));
  assert.strictEqual((await call('POST', '/api/shops', { name: 'Kandivali Spares', market: 'Kandivali', categories: ['washer'] })).status, 201);
  assert.strictEqual((await call('GET', '/api/facts')).body.facts.length, 14);
});

test('part search understands plain descriptions', async () => {
  const r = await call('GET', '/api/parts?q=' + encodeURIComponent('geyser not heating'));
  assert.strictEqual(r.body.parts[0].id, 'geyser-element');
  const one = await call('GET', '/api/parts/ac-capacitor');
  assert.deepStrictEqual(one.body.listed_price_inr, { low: 140, high: 450 });
  assert.strictEqual((await call('GET', '/api/parts/nope')).status, 404);
});

test('full flow: request, demo and real replies, ranking, reserve, pay', async () => {
  const shop = await call('POST', '/api/shops', { name: 'Test Spares', shop_no: 'Shop 9', market: 'Lohar Chawl', categories: ['ac'] });
  assert.strictEqual(shop.status, 201);
  const shopToken = shop.body.shop_token;

  const req = await call('POST', '/api/requests', { part_id: 'ac-capacitor', persona: 'home', prefer: 'genuine', delivery: 'deliver', area: 'Kurla' });
  assert.strictEqual(req.status, 201);
  const id = req.body.request.id, buyer = req.body.buyer_token;
  assert.strictEqual(req.body.summary.shops_asked, 15);
  assert.strictEqual(req.body.summary.have_it, 0, 'demo replies are not visible yet');

  const inbox = await call('GET', '/api/shop/inbox', undefined, shopToken);
  assert.strictEqual(inbox.status, 200);
  assert.ok(inbox.body.open.some(r => r.id === id));

  const offer = await call('POST', '/api/requests/' + id + '/offers', { status: 'yes', type: 'genuine', price_inr: 200, warranty_days: 180, ready_in_min: 5 }, shopToken);
  assert.strictEqual(offer.status, 201);
  assert.strictEqual(offer.body.price_check.flag, 'ok');

  clock += 60_000;
  const view = await call('GET', '/api/requests/' + id);
  assert.ok(view.body.summary.have_it >= 2);
  assert.strictEqual(view.body.summary.still_arriving, 0);
  assert.strictEqual(view.body.offers[0].shop, 'Test Spares', 'cheapest genuine offer ranks first');
  assert.strictEqual(view.body.offers[0].best, true);

  assert.strictEqual((await call('POST', '/api/requests/' + id + '/reserve', { shop_id: shop.body.shop.id })).status, 401);
  assert.strictEqual((await call('POST', '/api/requests/' + id + '/reserve', { shop_id: shop.body.shop.id }, shopToken)).status, 403);
  const res = await call('POST', '/api/requests/' + id + '/reserve', { shop_id: shop.body.shop.id }, buyer);
  assert.strictEqual(res.status, 200);
  assert.deepStrictEqual([res.body.request.reserved.part_price_inr, res.body.request.reserved.fee_inr, res.body.request.reserved.delivery_inr, res.body.request.reserved.total_inr], [200, 29, 60, 289]);
  assert.match(res.body.request.reserved.pickup_code, /^PZ-\d{4}$/);
  assert.strictEqual(res.body.payment.provider, 'demo');
  assert.strictEqual((await call('POST', '/api/requests/' + id + '/reserve', { shop_id: shop.body.shop.id }, buyer)).status, 409);
  assert.strictEqual((await call('POST', '/api/requests/' + id + '/offers', { status: 'no' }, shopToken)).status, 409, 'closed requests take no offers');

  const paid = await call('POST', '/api/requests/' + id + '/pay', {}, buyer);
  assert.strictEqual(paid.body.request.status, 'paid');
  const orders = (await call('GET', '/api/shop/inbox', undefined, shopToken)).body.orders;
  assert.strictEqual(orders[0].id, id);
});

test('technicians pay no fee; budgets filter offers; cancel works', async () => {
  const req = await call('POST', '/api/requests', { part_id: 'wm-drain-pump', persona: 'tech', prefer: 'cheap', delivery: 'pickup', max_price_inr: 1200 });
  clock += 60_000;
  const v = (await call('GET', '/api/requests/' + req.body.request.id)).body;
  assert.ok(v.offers.every(o => o.price_inr <= 1200));
  if (v.fees_if_best) assert.strictEqual(v.fees_if_best.fee, 0);
  const c = await call('POST', '/api/requests/' + req.body.request.id + '/cancel', {}, req.body.buyer_token);
  assert.strictEqual(c.body.request.status, 'cancelled');
});

test('a part described in words still reaches the shops', async () => {
  const req = await call('POST', '/api/requests', { part_name: 'Microwave turntable motor', category: 'general', include_demo: false });
  assert.strictEqual(req.status, 201);
  assert.strictEqual(req.body.request.part_id, null);
  assert.strictEqual(req.body.summary.shops_asked >= 1, true, 'registered shops count for general parts');
});

test('validation and security', async () => {
  assert.strictEqual((await call('POST', '/api/requests', { part_id: "x' OR 1=1 --" })).status, 400);
  assert.strictEqual((await call('POST', '/api/requests', { part_id: 'ac-capacitor', persona: 'boss' })).status, 400);
  assert.strictEqual((await call('POST', '/api/requests', { part_id: 'ac-capacitor', max_price_inr: -5 })).status, 400);
  assert.strictEqual((await call('POST', '/api/requests', '{not json')).status, 400);
  assert.strictEqual((await call('POST', '/api/requests', { part_id: 'ac-capacitor' }, null, { 'Content-Type': 'text/plain' })).status, 415);
  assert.strictEqual((await call('POST', '/api/requests', { note: 'x'.repeat(40000) })).status, 413);
  assert.strictEqual((await call('POST', '/api/shops', { name: 'A', market: 'Lohar Chawl', categories: ['ac'] })).status, 400);
  assert.strictEqual((await call('POST', '/api/shops', { name: 'Good name', market: 'Mars', categories: ['ac'] })).status, 400);
  assert.strictEqual((await call('GET', '/api/shop/inbox', undefined, 'x'.repeat(30))).status, 403);
  const shop = (await call('POST', '/api/shops', { name: 'Validator', market: 'Lohar Chawl', categories: ['ac'] })).body;
  const req = (await call('POST', '/api/requests', { part_id: 'ac-capacitor' })).body;
  assert.strictEqual((await call('POST', '/api/requests/' + req.request.id + '/offers', { status: 'yes', type: 'genuine', price_inr: 'free' }, shop.shop_token)).status, 400);
  assert.strictEqual((await call('GET', '/api/requests/req_doesnotexist')).status, 404);
  const page = await call('GET', '/');
  assert.strictEqual(page.status, 200);
  assert.match(page.headers.get('content-security-policy'), /default-src 'self'/);
  assert.strictEqual(page.headers.get('x-frame-options'), 'DENY');
  assert.strictEqual((await call('GET', '/..%2f..%2fpackage.json')).status, 404);
  assert.strictEqual((await call('GET', '/../src/server.js')).status, 404);
});

test('car-parts search follows the architecture document', async () => {
  const r = await call('GET', '/api/search?part=brake&year=2021&make=' + encodeURIComponent('Maruti Suzuki') + '&model=Swift');
  assert.deepStrictEqual(r.body.parts.map(p => p.part_number), ['BRK-SW-F']);
  assert.strictEqual((await call('GET', '/api/search?part=%25')).body.count, 0, 'LIKE wildcards are escaped');
  assert.ok((await call('GET', '/api/search?part=filter')).body.count >= 3);
  assert.strictEqual((await call('GET', '/api/search?year=abc')).status, 400);
  assert.strictEqual((await call('GET', '/api/vehicles')).body.vehicles.length, 5);
});

test('llms.txt guides AI assistants', async () => {
  const r = await call('GET', '/llms.txt');
  assert.match(r.text, /POST \/api\/requests/);
});
