'use strict';
// Copilot tests. Claude and Gemini are replaced by scripted fakes, so no key or network is needed.
const test = require('node:test');
const assert = require('node:assert');
const { createApp } = require('../src/server.js');
const A = require('../src/agent.js');

function withEnv(vars, fn) {
  const keep = {};
  for (const k of ['GEMINI_API_KEY', 'ANTHROPIC_API_KEY', 'GEMINI_MODEL', 'ANTHROPIC_AGENT_MODEL']) { keep[k] = process.env[k]; delete process.env[k]; }
  Object.assign(process.env, vars);
  return Promise.resolve().then(fn).finally(() => { for (const [k, v] of Object.entries(keep)) { if (v === undefined) delete process.env[k]; else process.env[k] = v; } });
}
const json = (obj, status = 200) => new Response(JSON.stringify(obj), { status, headers: { 'Content-Type': 'application/json' } });

// A fake Claude that plays a script: each step either calls tools or answers in text.
function fakeClaude(script, calls) {
  return async (url, init) => {
    const body = JSON.parse(init.body);
    calls.push({ url, headers: init.headers, body });
    const step = script[calls.length - 1];
    if (typeof step === 'function') return step(body);
    if (step.tools) return json({ stop_reason: 'tool_use', content: [{ type: 'text', text: 'Let me check.' }].concat(step.tools.map((t, i) => ({ type: 'tool_use', id: 'tu_' + calls.length + '_' + i, name: t[0], input: t[1] }))) });
    return json({ stop_reason: 'end_turn', content: [{ type: 'text', text: step.text }] });
  };
}
function fakeGemini(script, calls) {
  return async (url, init) => {
    const body = JSON.parse(init.body);
    calls.push({ url, headers: init.headers, body });
    const step = script[calls.length - 1];
    if (step.status) return json({ error: { message: 'x' } }, step.status);
    if (step.tools) return json({ candidates: [{ content: { role: 'model', parts: step.tools.map(t => ({ functionCall: { name: t[0], args: t[1] }, thoughtSignature: 'sig' })) } }] });
    return json({ candidates: [{ content: { role: 'model', parts: [{ text: step.text }] } }] });
  };
}

async function withServer(opts, fn) {
  const app = createApp(Object.assign({ dbFile: ':memory:' }, opts));
  await new Promise(r => app.listen(0, '127.0.0.1', r));
  const base = 'http://127.0.0.1:' + app.address().port;
  const call = async (method, path, body) => {
    const r = await fetch(base + path, { method, headers: body ? { 'Content-Type': 'application/json' } : {}, body: body ? JSON.stringify(body) : undefined });
    return { status: r.status, body: await r.json().catch(() => null) };
  };
  try { await fn(call); } finally { await new Promise(r => app.close(r)); }
}
const say = text => ({ view: 'find', messages: [{ role: 'user', text }] });

test('messages are cleaned: trimmed, merged, must end with the user', () => {
  assert.deepStrictEqual(A.cleanMessages([{ role: 'assistant', text: 'hi' }, { role: 'user', text: ' a ' }, { role: 'user', text: 'b' }]), [{ role: 'user', text: 'a\n\nb' }]);
  assert.throws(() => A.cleanMessages([{ role: 'user', text: 'a' }, { role: 'assistant', text: 'b' }]), /ending with the user/);
  assert.throws(() => A.cleanMessages('nope'), /list/);
  assert.strictEqual(A.cleanMessages(Array.from({ length: 50 }, (_, i) => ({ role: i % 2 ? 'assistant' : 'user', text: 'm' + i })).concat([{ role: 'user', text: 'last' }])).length <= 21, true);
});

test('the system prompt carries the real numbers and the honesty rules', () => withEnv({ ANTHROPIC_API_KEY: 'k' }, () => {
  const p = A.systemPrompt('markets');
  assert.match(p, /Claude/);
  assert.match(p, /72 shops from public listings/);
  assert.match(p, /14 auto-replying shops are invented/);
  assert.match(p, /"markets" tab/);
}));

test('copilot is off without a key, and health says so', () => withEnv({}, () => withServer({}, async call => {
  const h = await call('GET', '/api/health');
  assert.strictEqual(h.body.copilot, null);
  const r = await call('POST', '/api/agent', say('hi'));
  assert.strictEqual(r.status, 503);
})));

test('Claude: tools run against live data, screen actions come back', () => withEnv({ ANTHROPIC_API_KEY: 'sk-test' }, async () => {
  const calls = [];
  const script = [
    { tools: [['shops_near', { area: 'Andheri West' }], ['show_on_screen', { view: 'markets', area: 'Andheri West' }]] },
    body => {
      const results = body.messages[body.messages.length - 1].content;
      const near = JSON.parse(results[0].content);
      assert.strictEqual(near.area, 'Andheri');
      assert.ok(near.exact && near.listed_shops.length >= 5);
      assert.ok(near.demo_shops_here.includes('Sai Krupa Electronics'));
      return json({ stop_reason: 'end_turn', content: [{ type: 'text', text: 'Andheri has ' + near.count + ' listed shops.' }] });
    }
  ];
  await withServer({ agentFetch: fakeClaude(script, calls) }, async call => {
    const h = await call('GET', '/api/health');
    assert.strictEqual(h.body.copilot, 'claude');
    assert.strictEqual(h.body.copilot_model, A.CLAUDE_AGENT_MODEL);
    const r = await call('POST', '/api/agent', say('Show the judges the shops in Andheri'));
    assert.strictEqual(r.status, 200, JSON.stringify(r.body));
    assert.strictEqual(r.body.reply, 'Andheri has 7 listed shops.');
    assert.deepStrictEqual(r.body.tools_used, ['shops_near', 'show_on_screen']);
    assert.deepStrictEqual(r.body.actions, [{ type: 'show', view: 'markets', area: 'Andheri', zone: 'Western Suburbs' }]);
    assert.strictEqual(r.body.provider, 'claude');
    // what was sent to Claude
    assert.strictEqual(calls[0].url, 'https://api.anthropic.com/v1/messages');
    assert.strictEqual(calls[0].headers['x-api-key'], 'sk-test');
    assert.strictEqual(calls[0].body.model, A.CLAUDE_AGENT_MODEL);
    assert.strictEqual(calls[0].body.tools.length, A.TOOLS.length);
    assert.strictEqual(calls[1].body.messages.length, 3); // user, assistant tool_use, user tool_result
  });
}));

test('Claude: ask the market, read offers, reserve, all through the copilot', () => withEnv({ ANTHROPIC_API_KEY: 'sk-test' }, async () => {
  const calls = [];
  let reqId, shopId;
  const t0 = Date.now();
  let clock = t0;
  const script = [
    { tools: [['find_part', { query: 'AC outdoor unit hums, capacitor' }]] },
    body => {
      const found = JSON.parse(body.messages.at(-1).content[0].content);
      assert.strictEqual(found.parts[0].id, 'ac-capacitor');
      return json({ stop_reason: 'tool_use', content: [{ type: 'tool_use', id: 't2', name: 'ask_market', input: { part_id: 'ac-capacitor', area: 'Kurla', prefer: 'genuine', persona: 'tech', sticker: 'Voltas 1.5 T split AC' } }] });
    },
    body => {
      const posted = JSON.parse(body.messages.at(-1).content[0].content);
      assert.match(posted.request_id, /^req_/);
      assert.strictEqual(posted.shops_asked_across_mumbai, 14);
      assert.strictEqual(posted.of_which_demo_shops, 14);
      assert.strictEqual(posted.of_which_purza_shops, 0);
      reqId = posted.request_id;
      return json({ stop_reason: 'end_turn', content: [{ type: 'text', text: 'Posted. Replies in about a minute.' }] });
    },
    () => { clock = t0 + 120000; return json({ stop_reason: 'tool_use', content: [{ type: 'tool_use', id: 't4', name: 'get_offers', input: { request_id: reqId } }] }); },
    body => {
      const v = JSON.parse(body.messages.at(-1).content[0].content);
      assert.ok(v.offers.length > 0 && v.offers[0].best);
      shopId = v.offers[0].shop_id;
      return json({ stop_reason: 'tool_use', content: [{ type: 'tool_use', id: 't5', name: 'reserve_offer', input: { request_id: reqId, shop_id: shopId } }] });
    },
    body => {
      const v = JSON.parse(body.messages.at(-1).content[0].content);
      assert.strictEqual(v.reserved.shop_id, shopId);
      assert.match(v.reserved.pickup_code, /\S/);
      return json({ stop_reason: 'end_turn', content: [{ type: 'text', text: 'Reserved.' }] });
    }
  ];
  await withServer({ agentFetch: fakeClaude(script, calls), now: () => clock }, async call => {
    const first = await call('POST', '/api/agent', say('Ask the market for an AC capacitor in Kurla'));
    assert.strictEqual(first.status, 200, JSON.stringify(first.body));
    const open = first.body.actions.find(a => a.type === 'open_request');
    assert.strictEqual(open.id, reqId);
    assert.ok(open.token && open.token.length > 20);
    const req = await call('GET', '/api/requests/' + reqId);
    assert.strictEqual(req.body.request.via, 'agent');
    assert.strictEqual(req.body.request.sticker, 'Voltas 1.5 T split AC');
    const second = await call('POST', '/api/agent', { view: 'find', messages: [{ role: 'user', text: 'Ask the market for an AC capacitor in Kurla' }, { role: 'assistant', text: first.body.reply }, { role: 'user', text: 'Reserve the best one' }] });
    assert.strictEqual(second.status, 200, JSON.stringify(second.body));
    assert.strictEqual(second.body.reply, 'Reserved.');
    assert.deepStrictEqual(second.body.tools_used, ['get_offers', 'reserve_offer']);
    const after = await call('GET', '/api/requests/' + reqId);
    assert.strictEqual(after.body.request.status, 'reserved');
  });
}));

test('the copilot cannot reserve a request it did not post', () => withEnv({ ANTHROPIC_API_KEY: 'k' }, async () => {
  const calls = [];
  let msg;
  const script = [
    { tools: [['reserve_offer', { request_id: 'req_abcdefgh', shop_id: 'demo-kamdar' }]] },
    body => { msg = JSON.parse(body.messages.at(-1).content[0].content); return json({ stop_reason: 'end_turn', content: [{ type: 'text', text: 'ok' }] }); }
  ];
  await withServer({ agentFetch: fakeClaude(script, calls) }, async call => {
    const r = await call('POST', '/api/agent', say('reserve it'));
    assert.strictEqual(r.status, 200);
    assert.match(msg.error, /only reserve requests I posted/);
  });
}));

test('Gemini: function calls go back with their signatures; a retired model falls back', () => withEnv({ GEMINI_API_KEY: 'g-test' }, async () => {
  const calls = [];
  const script = [
    { status: 404 },
    { tools: [['market_overview', {}], ['show_on_screen', { view: 'why' }]] },
    { text: '72 shops across 30 areas.' }
  ];
  await withServer({ agentFetch: fakeGemini(script, calls) }, async call => {
    const r = await call('POST', '/api/agent', say('How big is the market?'));
    assert.strictEqual(r.status, 200, JSON.stringify(r.body));
    assert.strictEqual(r.body.provider, 'gemini');
    assert.strictEqual(r.body.reply, '72 shops across 30 areas.');
    assert.deepStrictEqual(r.body.actions, [{ type: 'show', view: 'why' }]);
    assert.match(calls[0].url, /gemini-3\.5-flash-lite/);
    assert.match(calls[1].url, /gemini-3\.1-flash-lite/);
    const last = calls[2].body.contents;
    assert.strictEqual(last.at(-2).parts[0].thoughtSignature, 'sig');
    const resp = last.at(-1).parts[0].functionResponse;
    assert.strictEqual(resp.name, 'market_overview');
    assert.strictEqual(resp.response.result.public_listings, 72);
    // a tool with no inputs is declared without parameters
    const decl = calls[1].body.tools[0].functionDeclarations.find(d => d.name === 'market_overview');
    assert.strictEqual(decl.parameters, undefined);
    assert.strictEqual(calls[1].headers['x-goog-api-key'], 'g-test');
  });
}));

test('errors: quota, bad input, unknown tool, too many messages per minute', () => withEnv({ ANTHROPIC_API_KEY: 'k' }, async () => {
  const calls = [];
  const script = [
    () => json({ error: 'rate' }, 429),
    { tools: [['no_such_tool', {}], ['show_on_screen', { view: 'nowhere' }]] },
    body => {
      const res = body.messages.at(-1).content.map(c => JSON.parse(c.content));
      assert.match(res[0].error, /Unknown tool/);
      assert.match(res[1].error, /Unknown tab/);
      return json({ stop_reason: 'end_turn', content: [{ type: 'text', text: 'fine' }] });
    }
  ];
  await withServer({ agentFetch: fakeClaude(script, calls), agentPerMinute: 3 }, async call => {
    assert.strictEqual((await call('POST', '/api/agent', say('hi'))).status, 429);
    assert.strictEqual((await call('POST', '/api/agent', { messages: [] })).status, 400);
    const ok = await call('POST', '/api/agent', say('go'));
    assert.strictEqual(ok.status, 200, JSON.stringify(ok.body));
    assert.deepStrictEqual(ok.body.actions, []);
    const limited = await call('POST', '/api/agent', say('again'));
    assert.strictEqual(limited.status, 429);
    assert.match(limited.body.error, /copilot/);
  });
}));

test('a follow-up turn reads offers for the request posted earlier in the chat, and the last round forces an answer', () => withEnv({ GEMINI_API_KEY: 'g' }, async () => {
  assert.deepStrictEqual(A.cleanRequests([{ id: 'req_abcdef', part_name: 'AC capacitor' }, { id: 'bad id' }, { id: 'req_abcdef' }, 'x']), [{ id: 'req_abcdef', part_name: 'AC capacitor' }]);
  let t = 0;
  const calls = [];
  // Turn 1: ask the market, then answer. Turn 2: keep calling get_offers (with no id) until tools are switched off.
  const script = [{ tools: [['ask_market', { part_id: 'ac-capacitor', area: 'Kurla' }]] }, { text: 'Posted.' }]
    .concat(Array.from({ length: 5 }, () => ({ tools: [['get_offers', {}]] })), [{ text: 'Here are the offers.' }]);
  await withServer({ now: () => t, agentFetch: fakeGemini(script, calls) }, async call => {
    const first = await call('POST', '/api/agent', say('Ask the market for an AC capacitor in Kurla'));
    assert.strictEqual(first.status, 200);
    const posted = first.body.actions.find(a => a.type === 'open_request');
    assert.ok(posted && /^req_/.test(posted.id));
    const result1 = calls[1].body.contents.at(-1).parts[0].functionResponse.response.result;
    assert.strictEqual(result1.shops_asked_across_mumbai, 14);
    t = 120000;
    const second = await call('POST', '/api/agent', Object.assign(say('Read me the offers'), { requests: [{ id: posted.id, part_name: posted.part_name }] }));
    assert.strictEqual(second.status, 200);
    assert.strictEqual(second.body.reply, 'Here are the offers.');
    assert.match(calls[2].body.systemInstruction.parts[0].text, new RegExp(posted.id));
    const offers = calls[3].body.contents.at(-1).parts[0].functionResponse.response.result;
    assert.strictEqual(offers.error, undefined);
    assert.strictEqual(offers.request.id, posted.id);
    assert.ok(offers.summary.have_it > 0);
    assert.strictEqual(calls[6].body.toolConfig.functionCallingConfig.mode, 'AUTO');
    assert.strictEqual(calls[7].body.toolConfig.functionCallingConfig.mode, 'NONE');
  });
  const p = A.systemPrompt('find', [{ id: 'req_abcdef', part_name: 'AC capacitor' }]);
  assert.match(p, /req_abcdef: AC capacitor/);
  assert.match(p, /Never post a new request unless/);
  assert.match(A.systemPrompt('find', []), /No request has been posted/);
}));
