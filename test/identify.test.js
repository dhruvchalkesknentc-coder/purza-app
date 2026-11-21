'use strict';
// Photo-check tests. The AI services are replaced by a fake fetch, so no key or network is needed.
const test = require('node:test');
const assert = require('node:assert');
const { createApp } = require('../src/server.js');
const P = require('../src/identify.js');

const IMG = Buffer.alloc(600, 7).toString('base64'); // stands in for a photo
const answer = obj => JSON.stringify(obj);
function fakeGemini(reply, calls, status = 200, firstStatus) {
  return async (url, init) => {
    calls.push({ url, init });
    const st = calls.length === 1 && firstStatus ? firstStatus : status;
    return new Response(JSON.stringify({ candidates: [{ content: { parts: [{ text: reply }] } }] }), { status: st, headers: { 'Content-Type': 'application/json' } });
  };
}
function withEnv(vars, fn) {
  const keep = {};
  for (const k of ['GEMINI_API_KEY', 'ANTHROPIC_API_KEY', 'GEMINI_MODEL']) { keep[k] = process.env[k]; delete process.env[k]; }
  Object.assign(process.env, vars);
  return Promise.resolve().then(fn).finally(() => { for (const [k, v] of Object.entries(keep)) { if (v === undefined) delete process.env[k]; else process.env[k] = v; } });
}

test('parseJSON copes with fences and extra words', () => {
  assert.deepStrictEqual(P.parseJSON('```json\n{"part_id":"ac-capacitor"}\n```'), { part_id: 'ac-capacitor' });
  assert.deepStrictEqual(P.parseJSON('Here you go: {"a":1} done'), { a: 1 });
  assert.throws(() => P.parseJSON('no json here'), /readable/);
});

test('normalize maps known parts and cleans unknown ones', () => {
  const k = P.normalize({ part_id: 'mixer-coupler', confidence: 1.7 });
  assert.strictEqual(k.part_id, 'mixer-coupler'); assert.strictEqual(k.category, 'mixer'); assert.strictEqual(k.confidence, 1);
  const o = P.normalize({ part_id: 'microwave-magnetron', part_name: 'Magnetron', category: 'spaceship' });
  assert.strictEqual(o.part_id, 'other'); assert.strictEqual(o.category, 'general'); assert.strictEqual(o.part_name, 'Magnetron');
  assert.strictEqual(P.normalize({ part_id: 'none' }).part_id, 'none');
});

test('Gemini is used when its key is set, with the image and the free model', () => withEnv({ GEMINI_API_KEY: 'test-key' }, async () => {
  const calls = [];
  const r = await P.identify({ mime_type: 'image/jpeg', image_base64: IMG }, fakeGemini(answer({ part_id: 'ac-capacitor', confidence: 0.9, label_text: '35+2.5 MFD' }), calls));
  assert.strictEqual(r.provider, 'gemini');
  assert.strictEqual(r.part_id, 'ac-capacitor');
  assert.strictEqual(r.label_text, '35+2.5 MFD');
  assert.match(calls[0].url, /models\/gemini-3\.5-flash-lite:generateContent$/);
  assert.strictEqual(calls[0].init.headers['x-goog-api-key'], 'test-key');
  const sent = JSON.parse(calls[0].init.body);
  assert.strictEqual(sent.contents[0].parts[1].inlineData.data, IMG);
}));

test('Gemini falls back to the next free model when one is retired', () => withEnv({ GEMINI_API_KEY: 'k' }, async () => {
  const calls = [];
  const r = await P.identify({ mime_type: 'image/jpeg', image_base64: IMG }, fakeGemini(answer({ part_id: 'geyser-element' }), calls, 200, 404));
  assert.strictEqual(calls.length, 2);
  assert.match(calls[1].url, /gemini-3\.1-flash-lite/);
  assert.strictEqual(r.part_id, 'geyser-element');
}));

test('Claude is used when only its key is set', () => withEnv({ ANTHROPIC_API_KEY: 'sk-test' }, async () => {
  const calls = [];
  const fake = async (url, init) => { calls.push({ url, init }); return new Response(JSON.stringify({ content: [{ type: 'text', text: answer({ part_id: 'fridge-olp', confidence: 0.7 }) }] }), { status: 200 }); };
  const r = await P.identify({ mime_type: 'image/png', image_base64: IMG }, fake);
  assert.strictEqual(r.provider, 'claude');
  assert.strictEqual(r.part_id, 'fridge-olp');
  assert.strictEqual(calls[0].url, 'https://api.anthropic.com/v1/messages');
  const sent = JSON.parse(calls[0].init.body);
  assert.strictEqual(sent.model, 'claude-haiku-5-5');
  assert.strictEqual(sent.messages[0].content[0].source.media_type, 'image/png');
}));

test('quota and bad input give clear errors', () => withEnv({ GEMINI_API_KEY: 'k' }, async () => {
  await assert.rejects(P.identify({ mime_type: 'image/jpeg', image_base64: IMG }, fakeGemini('{}', [], 429)), e => e.status === 429);
  await assert.rejects(P.identify({ mime_type: 'image/jpeg', image_base64: IMG }, fakeGemini('{}', [], 500)), e => e.status === 502);
  await assert.rejects(P.identify({ mime_type: 'image/gif', image_base64: IMG }), e => e.status === 400);
  await assert.rejects(P.identify({ mime_type: 'image/jpeg', image_base64: 'not base64!!' }), e => e.status === 400);
  const slow = async () => { const e = new Error('timed out'); e.name = 'TimeoutError'; throw e; };
  await assert.rejects(P.identify({ mime_type: 'image/jpeg', image_base64: IMG }, slow), e => e.status === 504);
}));

test('API: switched off without a key, works with one, and is rate-limited', () => withEnv({}, async () => {
  const calls = [];
  const app = createApp({ dbFile: ':memory:', identifyPerMinute: 2, identifyFetch: fakeGemini(answer({ part_id: 'wm-drain-pump', confidence: 0.8 }), calls) });
  await new Promise(r => app.listen(0, '127.0.0.1', r));
  const base = 'http://127.0.0.1:' + app.address().port;
  const post = body => fetch(base + '/api/identify', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
  try {
    assert.strictEqual((await (await fetch(base + '/api/health')).json()).ai, null);
    assert.strictEqual((await post({ mime_type: 'image/jpeg', image_base64: IMG })).status, 503);
    process.env.GEMINI_API_KEY = 'k';
    assert.strictEqual((await (await fetch(base + '/api/health')).json()).ai, 'gemini');
    const ok = await post({ mime_type: 'image/jpeg', image_base64: IMG });
    assert.strictEqual(ok.status, 200);
    assert.strictEqual((await ok.json()).part_id, 'wm-drain-pump');
    assert.strictEqual((await post({ mime_type: 'image/jpeg', image_base64: IMG })).status, 429, 'third call in a minute is refused');
  } finally { app.close(); app.db.close(); }
}));
