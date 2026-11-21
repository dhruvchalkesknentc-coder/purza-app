'use strict';
// Purza Copilot: the chat agent in the corner of the site. It helps the team run a live demo and
// answers questions from the live data, using the same tools as the rest of the site.
// It runs on Claude when ANTHROPIC_API_KEY is set (optional ANTHROPIC_AGENT_MODEL), otherwise on the
// free Gemini key (GEMINI_API_KEY, optional GEMINI_MODEL). With neither, the copilot stays hidden.
const L = require('./logic');
const { GEMINI_MODELS } = require('./identify');

const CLAUDE_AGENT_MODEL = 'claude-sonnet-5-5';
const VIEWS = ['find', 'shop', 'prices', 'markets', 'agents', 'cars', 'why'];
const TIMEOUT_MS = 30000;
const MAX_STEPS = 6;      // tool rounds per answer
const MAX_TURNS = 20;     // chat turns kept from the browser
const MAX_TEXT = 2000;    // characters per turn

function httpError(status, message) { return Object.assign(new Error(message), { status }); }

function provider() {
  if (process.env.ANTHROPIC_API_KEY) return 'claude';
  if (process.env.GEMINI_API_KEY) return 'gemini';
  return null;
}
function model() {
  const p = provider();
  if (p === 'claude') return process.env.ANTHROPIC_AGENT_MODEL || CLAUDE_AGENT_MODEL;
  if (p === 'gemini') return process.env.GEMINI_MODEL || GEMINI_MODELS[0];
  return null;
}

const obj = (properties, required) => ({ type: 'object', properties, required: required || [] });
const TOOLS = [
  { name: 'find_part', description: 'Find a spare part in the Purza catalogue from its name or from what is broken (English or Hinglish, e.g. "AC outdoor unit hums", "mixer ka coupler"). Returns matching parts with their listed Mumbai price ranges.',
    schema: obj({ query: { type: 'string', description: 'Part name or symptom' } }, ['query']) },
  { name: 'price_check', description: 'All listed prices for one part (genuine, compatible, trade), each with the Mumbai seller and a source link.',
    schema: obj({ part_id: { type: 'string', description: 'Part id from find_part, e.g. ac-capacitor' } }, ['part_id']) },
  { name: 'shops_near', description: 'Real parts shops from public listings in a Mumbai area, or the nearest ones in its zone if the area has none. These are NOT Purza partners. Also says which Purza and demo shops are in that area.',
    schema: obj({ area: { type: 'string', description: 'Mumbai area, e.g. Andheri West, Kandivali, Kurla, Vashi' } }, ['area']) },
  { name: 'market_overview', description: 'Live numbers for the pitch: shops by zone and area coverage, Purza shops joined, demo shops, price-guide size, open requests, fees and business model, and the market facts with sources.',
    schema: obj({}) },
  { name: 'ask_market', description: 'Post a real request to every matching parts shop in Mumbai (including the 14 demo shops, which reply automatically within about a minute). Opens it on the Find tab so the audience sees offers arrive. Use part_id when the part is in the catalogue, else part_name.',
    schema: obj({
      part_id: { type: 'string', description: 'Catalogue part id from find_part' },
      part_name: { type: 'string', description: 'Only when the part is not in the catalogue' },
      area: { type: 'string', description: 'Buyer area in Mumbai' },
      prefer: { type: 'string', enum: ['genuine', 'cheap', 'fast'], description: 'What matters most' },
      delivery: { type: 'string', enum: ['pickup', 'deliver'] },
      persona: { type: 'string', enum: ['tech', 'home'], description: 'Technician or household' },
      max_price_inr: { type: 'number', description: 'Budget in rupees, if any' },
      sticker: { type: 'string', description: 'Appliance model on the sticker, e.g. Voltas 1.5 T split AC' }
    }, ['area']) },
  { name: 'get_offers', description: 'Read the replies and ranked offers for a request: how many shops have it, best offer and why, fair-price check, fees.',
    schema: obj({ request_id: { type: 'string' } }, ['request_id']) },
  { name: 'reserve_offer', description: 'Reserve one shop\'s offer on a request that you posted. Only when the user clearly asks to reserve. Payment is in demo mode: no money moves.',
    schema: obj({ request_id: { type: 'string' }, shop_id: { type: 'string', description: 'shop_id from get_offers' } }, ['request_id', 'shop_id']) },
  { name: 'show_on_screen', description: 'Switch the website to a tab so the audience sees it. Tabs: find (ask the market), shop (shop desk), prices (price guide), markets (shops by area), agents (AI buyers API), cars (car parts preview), why (facts and business model). Optionally filter markets or find to an area, or open one part in the price guide.',
    schema: obj({
      view: { type: 'string', enum: VIEWS },
      area: { type: 'string', description: 'Mumbai area to filter to (markets or find)' },
      part_id: { type: 'string', description: 'Part to open (prices or find)' }
    }, ['view']) }
];

function systemPrompt(view, requests) {
  requests = requests || [];
  const D = L.D, F = D.FEES;
  const facts = D.FACTS.map(f => '- ' + f.stat + ' ' + f.label + ' (' + f.source + ')').join('\n');
  return [
    'You are Purza Copilot, the assistant built into the Purza website. You run on ' + (provider() === 'claude' ? 'Claude, by Anthropic' : 'Google Gemini') + '.',
    '',
    'Purza asks every appliance spare-parts shop across Mumbai at once. A technician or household names the part or describes what is broken; shops reply in one tap with price, genuine or compatible, warranty and ready time; the buyer reserves the best offer and pays by UPI. AI agents can do the same through the API. Mumbai only for now: Lohar Chawl and Lamington Road plus the suburbs (Andheri, Kandivali, Kurla, Thane, Vashi and more). Car parts come next.',
    '',
    'You are helping the Purza team (Krish and his co-founder, SP Jain School of Global Management) present Purza live to judges at the Stripe Community Mumbai x SP Jain hackathon. Help them run the demo, and give judges clear, honest answers.',
    '',
    'How to answer:',
    '- Be short: two to five sentences, or a few bullets. Plain words, rupee amounts, Indian English. If someone writes in Hinglish, answer in the same style.',
    '- Use the tools for every price, shop, count or request. Never guess a number. When you quote a market figure, name its source.',
    '- When you talk about something the site shows, also call show_on_screen so the audience sees it (for example shops in Andheri: markets tab filtered to Andheri).',
    '- Be honest about what is real and what is demo. Real: the price guide (Mumbai sellers\' listed prices with source links), ' + D.PUBLIC_LISTINGS.length + ' shops from public listings (not Purza partners), the market facts. Live: requests, shop sign-ups, replies and reservations are saved on the server (it is a free server, so data resets when it restarts). Demo: the ' + D.DEMO_SHOPS.length + ' auto-replying shops are invented, the UPI step moves no money, the car catalogue is a sample. Never present demo shops as real or listed shops as partners.',
    '- Reserve only when the user clearly asks. After ask_market, say that replies take about a minute and offer to read them out.',
    '- Never name your tools or write code-style words in a reply; the audience sees your words on a big screen.',
    '- Questions outside Purza: answer in a line and bring it back to the demo.',
    '',
    'The site\'s tabs: 01 Find a part (ask the market, live offers, photo check), 02 Shop desk (a shop joins and replies from its phone), 03 Price guide, 04 Markets (shops by Mumbai area), 05 AI buyers (four API calls and llms.txt for AI agents), 06 Car parts (preview), 07 Why Purza (facts and business model).',
    '',
    'Business model: technicians pay Rs ' + F.proPlan + ' a month for Purza Pro (unlimited asks); households pay Rs ' + F.householdSmall + ' per order for parts under Rs ' + F.smallBelow + ' and Rs ' + F.householdLarge + ' above, Rs 0 if no shop has it, plus Rs ' + F.delivery + ' for delivery; shops pay ' + F.shopCommissionPct + '% on orders after 3 free months, and replying is always free. Payments by UPI through Razorpay or Cashfree; Stripe for agent checkout as it opens up.',
    '',
    'A five-minute demo, if asked to walk through it (give one step at a time and offer to run it):',
    '1. The problem (30 s): a technician loses half a day walking shop to shop for a Rs 200 part and may come back with a fake; no search engine or AI assistant can see which shop has it today.',
    '2. Find a part (90 s): ask the market for an AC capacitor for a Voltas 1.5 T split AC in Kurla. Offers arrive within a minute with price, genuine or compatible, warranty and ready time, ranked, with a fair-price check. Reserve the best: pickup code and UPI link.',
    '3. Shop desk (45 s): open the site on a phone, join as a shop, and reply to the request in one tap.',
    '4. Markets and Price guide (45 s): real shops by Mumbai area from public listings, and Mumbai prices with sources.',
    '5. AI buyers (30 s): the same four API calls let ChatGPT, Claude or Gemini agents buy for a household; llms.txt describes them.',
    '6. Business model (30 s), then questions.',
    '',
    'Market facts you may quote (with source):',
    facts,
    '',
    'The presenter currently has the "' + view + '" tab open.',
    '',
    requests.length
      ? 'Requests you posted in this chat, newest first:\n' + requests.map(r => '- ' + r.id + ': ' + r.part_name).join('\n') + '\nWhen asked about offers or reserving, use the newest one unless the user names another. Never post a new request unless the user asks for a new one.'
      : 'No request has been posted in this chat yet. Post one only when the user asks you to ask the market.'
  ].join('\n');
}

// Turns from the browser: [{role: 'user'|'assistant', text}]. Keep the last few, merge repeats, start with the user.
function cleanMessages(list) {
  if (!Array.isArray(list)) throw httpError(400, 'messages must be a list');
  const out = [];
  for (const m of list.slice(-MAX_TURNS)) {
    if (!m || (m.role !== 'user' && m.role !== 'assistant')) continue;
    const text = String(m.text == null ? '' : m.text).slice(0, MAX_TEXT).trim();
    if (!text) continue;
    if (out.length && out[out.length - 1].role === m.role) out[out.length - 1].text += '\n\n' + text;
    else out.push({ role: m.role, text });
  }
  while (out.length && out[0].role !== 'user') out.shift();
  if (!out.length || out[out.length - 1].role !== 'user') throw httpError(400, 'Send at least one message, ending with the user\'s');
  return out;
}

// Requests the panel says the copilot posted earlier in this chat: [{id, part_name}], newest first.
function cleanRequests(list) {
  if (!Array.isArray(list)) return [];
  const out = [];
  for (const r of list.slice(0, 5)) {
    if (!r || typeof r.id !== 'string' || !/^req_[A-Za-z0-9_-]{4,40}$/.test(r.id) || out.some(o => o.id === r.id)) continue;
    out.push({ id: r.id, part_name: String(r.part_name || 'part').replace(/\s+/g, ' ').slice(0, 100) });
  }
  return out;
}

async function check(res, who) {
  if (res.ok) return;
  const body = (await res.text().catch(() => '')).slice(0, 300);
  console.warn(who + ' error', res.status, body);
  if (res.status === 429) throw httpError(429, 'The AI limit is used up for the moment. Try again in a minute.');
  if (res.status === 401 || res.status === 403) throw httpError(502, 'The server\'s ' + who + ' key was refused. Check it in the server settings.');
  if (res.status === 529 || res.status === 503) throw httpError(503, who + ' is busy right now. Try again in a few seconds.');
  throw httpError(502, 'The copilot could not get an answer from ' + who + '. Try again.');
}

async function runClaude(msgs, system, exec, fetchImpl) {
  const messages = msgs.map(m => ({ role: m.role, content: m.text }));
  const tools = TOOLS.map(t => ({ name: t.name, description: t.description, input_schema: t.schema }));
  for (let step = 0; step < MAX_STEPS; step++) {
    const res = await fetchImpl('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-api-key': process.env.ANTHROPIC_API_KEY, 'anthropic-version': '2023-06-01' },
      // On the last round tools are switched off, so the model has to answer with what it has.
      body: JSON.stringify(Object.assign({ model: model(), max_tokens: 1024, system, tools, messages }, step === MAX_STEPS - 1 ? { tool_choice: { type: 'none' } } : {})),
      signal: AbortSignal.timeout(TIMEOUT_MS)
    });
    await check(res, 'Claude');
    const j = await res.json();
    const content = Array.isArray(j.content) ? j.content : [];
    const calls = content.filter(b => b.type === 'tool_use');
    const text = content.filter(b => b.type === 'text').map(b => b.text).join('\n').trim();
    if (j.stop_reason !== 'tool_use' || !calls.length) return text;
    messages.push({ role: 'assistant', content });
    const results = [];
    for (const c of calls) results.push({ type: 'tool_result', tool_use_id: c.id, content: JSON.stringify(await exec(c.name, c.input)) });
    messages.push({ role: 'user', content: results });
  }
  return 'That took more steps than I allow for one answer. Try asking for one thing at a time.';
}

async function runGemini(msgs, system, exec, fetchImpl) {
  const contents = msgs.map(m => ({ role: m.role === 'assistant' ? 'model' : 'user', parts: [{ text: m.text }] }));
  // Gemini refuses an OBJECT schema with no properties, so a tool without inputs sends no parameters.
  const declarations = TOOLS.map(t => Object.keys(t.schema.properties).length ? { name: t.name, description: t.description, parameters: t.schema } : { name: t.name, description: t.description });
  const models = [...new Set([process.env.GEMINI_MODEL, ...GEMINI_MODELS].filter(Boolean))];
  let mi = 0;
  for (let step = 0; step < MAX_STEPS; step++) {
    const res = await fetchImpl('https://generativelanguage.googleapis.com/v1beta/models/' + encodeURIComponent(models[mi]) + ':generateContent', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-goog-api-key': process.env.GEMINI_API_KEY },
      body: JSON.stringify({
        systemInstruction: { parts: [{ text: system }] },
        contents,
        tools: [{ functionDeclarations: declarations }],
        toolConfig: { functionCallingConfig: { mode: step === MAX_STEPS - 1 ? 'NONE' : 'AUTO' } },
        generationConfig: { temperature: 0.4, maxOutputTokens: 1024 }
      }),
      signal: AbortSignal.timeout(TIMEOUT_MS)
    });
    if (res.status === 404 && mi < models.length - 1) { mi++; step--; continue; } // model retired: try the next free one
    await check(res, 'Gemini');
    const j = await res.json();
    const content = j.candidates && j.candidates[0] && j.candidates[0].content;
    const parts = (content && content.parts) || [];
    const calls = parts.filter(p => p.functionCall);
    const text = parts.filter(p => typeof p.text === 'string' && !p.thought).map(p => p.text).join('').trim();
    if (!calls.length) return text;
    contents.push(content); // sent back as it came, with any thought signatures
    const responses = [];
    for (const c of calls) {
      const fc = c.functionCall;
      const result = await exec(fc.name, fc.args);
      responses.push({ functionResponse: Object.assign(fc.id ? { id: fc.id } : {}, { name: fc.name, response: { result } }) });
    }
    contents.push({ role: 'user', parts: responses });
  }
  return 'That took more steps than I allow for one answer. Try asking for one thing at a time.';
}

// body: { messages: [{role, text}], view }. tools: { name: async (args, ctx) => result } from server.js.
async function run(body, tools, fetchImpl) {
  const p = provider();
  if (!p) throw httpError(503, 'The copilot is switched off on this server. Add ANTHROPIC_API_KEY (Claude) or GEMINI_API_KEY.');
  const msgs = cleanMessages(body && body.messages);
  const view = VIEWS.includes(body.view) ? body.view : 'find';
  const requests = cleanRequests(body.requests);
  const system = systemPrompt(view, requests);
  const ctx = { actions: [], used: [], requests };
  const exec = async (name, args) => {
    ctx.used.push(name);
    const fn = Object.prototype.hasOwnProperty.call(tools, name) ? tools[name] : null;
    if (!fn) return { error: 'Unknown tool ' + name };
    try { return await fn(args && typeof args === 'object' ? args : {}, ctx); }
    catch (e) { return { error: e.message || 'That did not work' }; }
  };
  let reply;
  try { reply = p === 'claude' ? await runClaude(msgs, system, exec, fetchImpl) : await runGemini(msgs, system, exec, fetchImpl); }
  catch (e) {
    if (e && (e.name === 'TimeoutError' || e.name === 'AbortError')) throw httpError(504, 'The AI took too long to answer. Try again.');
    if (e && e.status) throw e;
    console.warn('Copilot failed', e);
    throw httpError(502, 'The copilot could not reach the AI service. Try again.');
  }
  return { reply: reply || 'Done.', actions: ctx.actions, tools_used: ctx.used, provider: p, model: model() };
}

module.exports = { run, provider, model, systemPrompt, cleanMessages, cleanRequests, TOOLS, VIEWS, CLAUDE_AGENT_MODEL };
