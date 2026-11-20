const test = require('node:test');
const assert = require('node:assert');
const L = require('../src/logic.js');
const D = L.D;

test('every part has bands and demo replies with at least one offer', () => {
  for (const p of D.PARTS) {
    const b = L.demoBands(p);
    assert.ok(b.genuine[0] <= b.genuine[1] && b.compatible[0] <= b.compatible[1], p.id);
    for (const seed of ['a', 'b', 'c', 'xyz123']) {
      const r = L.makeDemoReplies(p, seed);
      assert.strictEqual(r.length, D.DEMO_SHOPS.length);
      assert.ok(r.some(x => x.status === 'yes'), p.id + ' ' + seed);
      for (const x of r.filter(x => x.status === 'yes')) {
        const f = L.fairCheck(p, x.type, x.price);
        assert.notStrictEqual(f.flag, 'high', p.id + ' demo price flagged high: ' + x.price);
      }
    }
  }
});
test('demo replies are deterministic per request id', () => {
  const p = D.PARTS[0];
  assert.deepStrictEqual(L.makeDemoReplies(p, 'r1'), L.makeDemoReplies(p, 'r1'));
  assert.notDeepStrictEqual(L.makeDemoReplies(p, 'r1'), L.makeDemoReplies(p, 'r2'));
});
test('ranking and totals', () => {
  const offers = [{ type: 'compatible', price: 200, warranty: 30, ready: 5 }, { type: 'genuine', price: 400, warranty: 180, ready: 10 }, { type: 'genuine', price: 350, warranty: 90, ready: 20 }];
  assert.strictEqual(L.rankOffers(offers, 'genuine')[0].price, 350);
  assert.strictEqual(L.rankOffers(offers, 'cheap')[0].price, 200);
  assert.strictEqual(L.rankOffers(offers, 'fast')[0].ready, 5);
  assert.deepStrictEqual(L.totals(395, 'tech', 'deliver'), { part: 395, fee: 0, delivery: 60, total: 455 });
  assert.deepStrictEqual(L.totals(395, 'home', 'pickup'), { part: 395, fee: 29, delivery: 0, total: 424 });
  assert.deepStrictEqual(L.totals(1290, 'home', 'deliver'), { part: 1290, fee: 49, delivery: 60, total: 1399 });
  assert.match(L.pickupCode('abc', 'demo-kamdar'), /^PZ-\d{4}$/);
});
test('price check flags', () => {
  const p = D.PARTS.find(x => x.id === 'ac-capacitor');
  assert.strictEqual(L.fairCheck(p, 'genuine', 400).flag, 'ok');
  assert.strictEqual(L.fairCheck(p, 'genuine', 900).flag, 'high');
  assert.strictEqual(L.fairCheck(p, 'genuine', 90).flag, 'low');
  assert.strictEqual(L.fairCheck(L.customPart({ part_name: 'x' }), 'genuine', 100), null);
});
test('text matching', () => {
  assert.strictEqual(L.matchPartFromText('Bajaj mixer ka coupler toot gaya'), 'mixer-coupler');
  assert.strictEqual(L.matchPartFromText('geyser not heating'), 'geyser-element');
  assert.strictEqual(L.matchPartFromText('AC outdoor unit hums, compressor not starting'), 'ac-capacitor');
  assert.strictEqual(L.matchPartFromText('washing machine water not draining front load'), 'wm-drain-pump');
  assert.strictEqual(L.matchPartFromText("My geyser isn't heating. Get a genuine heating element under ₹700"), 'geyser-element');
  assert.strictEqual(L.matchPartFromText('hello'), null);
});
test('validation', () => {
  assert.strictEqual(L.validateOffer({ status: 'yes', type: 'genuine', price: 300, warranty: 180, ready: 10 }), null);
  assert.ok(L.validateOffer({ status: 'yes', type: 'genuine', price: NaN, warranty: 180, ready: 10 }));
  assert.strictEqual(L.validateOffer({ status: 'no' }), null);
  assert.strictEqual(L.validateShop({ name: 'Kamdar', market: 'Lohar Chawl', cats: ['ac'] }), null);
  assert.ok(L.validateShop({ name: 'K', market: 'Lohar Chawl', cats: ['ac'] }));
  assert.ok(L.validateShop({ name: 'Kamdar', market: 'Mars', cats: ['ac'] }));
});
test('car search mirrors /api/search', () => {
  const r = L.carSearch({ year: 2021, make: 'Maruti Suzuki', model: 'Swift', part: 'brake' });
  assert.deepStrictEqual(r.map(p => p.part_number), ['BRK-SW-F']);
  assert.ok(L.carSearch({ part: 'filter' }).length >= 3);
});
