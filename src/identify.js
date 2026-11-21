'use strict';
// Photo check: works out which spare part is in a photo, using Google Gemini (free tier) or Claude.
// Set ONE of these on the server (for example in Render > Environment):
//   GEMINI_API_KEY     free key from https://aistudio.google.com/apikey   (optional GEMINI_MODEL)
//   ANTHROPIC_API_KEY  Claude key from https://console.anthropic.com      (optional ANTHROPIC_MODEL)
// With neither set, the photo check stays switched off and the rest of Purza works as before.
const L = require('./logic');

const GEMINI_MODELS = ['gemini-3.5-flash-lite', 'gemini-3.1-flash-lite'];
const CLAUDE_MODEL = 'claude-haiku-5-5';
const MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
const MAX_IMAGE_BYTES = 4 * 1024 * 1024;
const TIMEOUT_MS = 25000;

function httpError(status, message) { return Object.assign(new Error(message), { status }); }

function provider() {
  if (process.env.GEMINI_API_KEY) return 'gemini';
  if (process.env.ANTHROPIC_API_KEY) return 'claude';
  return null;
}

function prompt() {
  const list = L.D.PARTS.map(p => p.id + ': ' + p.name + ' (' + p.appliance + ')').join('\n');
  return 'You help buyers in Mumbai, India identify a broken home-appliance spare part from one photo so local parts shops can quote for it.\n'
    + 'Known parts (id: name):\n' + list + '\n\n'
    + 'Look at the photo and answer with one JSON object only, no other text:\n'
    + '{"part_id": one of the ids above, or "other" if it is a different appliance part, or "none" if it is not an appliance part,'
    + ' "part_name": short name, "appliance": the appliance it comes from, "category": one of ' + L.CAT_LIST.join('|') + '|general,'
    + ' "local_name": what a Mumbai shopkeeper calls it, "check": one sentence on what the shop must match (values, size, connector),'
    + ' "label_text": any model or rating printed on it, or "", "confidence": number from 0 to 1}';
}

// Models sometimes wrap JSON in ```json fences or add a sentence; take the outermost object.
function parseJSON(text) {
  const s = String(text || '');
  const a = s.indexOf('{'), b = s.lastIndexOf('}');
  if (a < 0 || b <= a) throw httpError(502, 'The AI did not return a readable answer. Pick the part from the list.');
  try { return JSON.parse(s.slice(a, b + 1)); } catch (e) { throw httpError(502, 'The AI did not return a readable answer. Pick the part from the list.'); }
}

function normalize(r) {
  const part = L.PART_BY_ID[r.part_id];
  const partId = part ? part.id : r.part_id === 'none' ? 'none' : 'other';
  const conf = Number(r.confidence);
  return {
    part_id: partId,
    part_name: L.clip(r.part_name, 80) || (part ? part.short : ''),
    appliance: L.clip(r.appliance, 80) || (part ? part.appliance : ''),
    category: L.CAT_LIST.includes(r.category) ? r.category : part ? part.cat : 'general',
    local_name: L.clip(r.local_name, 60),
    check: L.clip(r.check, 200),
    label_text: L.clip(r.label_text, 60),
    confidence: Number.isFinite(conf) ? Math.max(0, Math.min(1, conf)) : null
  };
}

async function callGemini(b64, mime, fetchImpl) {
  const models = [...new Set([process.env.GEMINI_MODEL, ...GEMINI_MODELS].filter(Boolean))];
  for (let i = 0; i < models.length; i++) {
    const res = await fetchImpl('https://generativelanguage.googleapis.com/v1beta/models/' + encodeURIComponent(models[i]) + ':generateContent', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-goog-api-key': process.env.GEMINI_API_KEY },
      body: JSON.stringify({
        contents: [{ role: 'user', parts: [{ text: prompt() }, { inlineData: { mimeType: mime, data: b64 } }] }],
        generationConfig: { responseMimeType: 'application/json', temperature: 0.2 }
      }),
      signal: AbortSignal.timeout(TIMEOUT_MS)
    });
    if (res.status === 404 && i < models.length - 1) continue; // model retired: try the next free one
    if (res.status === 429) throw httpError(429, 'The free AI limit is used up for the moment. Try again in a minute, or pick the part from the list.');
    if (!res.ok) { console.warn('Gemini error', res.status, (await res.text()).slice(0, 300)); throw httpError(502, 'The AI could not read the photo. Pick the part from the list.'); }
    const j = await res.json();
    const parts = (j.candidates && j.candidates[0] && j.candidates[0].content && j.candidates[0].content.parts) || [];
    return parseJSON(parts.filter(p => !p.thought && typeof p.text === 'string').map(p => p.text).join(''));
  }
  throw httpError(502, 'No Gemini model was available.');
}

async function callClaude(b64, mime, fetchImpl) {
  const res = await fetchImpl('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: { 'content-type': 'application/json', 'x-api-key': process.env.ANTHROPIC_API_KEY, 'anthropic-version': '2023-06-01' },
    body: JSON.stringify({
      model: process.env.ANTHROPIC_MODEL || CLAUDE_MODEL,
      max_tokens: 500,
      messages: [{ role: 'user', content: [{ type: 'image', source: { type: 'base64', media_type: mime, data: b64 } }, { type: 'text', text: prompt() }] }]
    }),
    signal: AbortSignal.timeout(TIMEOUT_MS)
  });
  if (res.status === 429) throw httpError(429, 'The AI is busy. Try again in a minute, or pick the part from the list.');
  if (!res.ok) { console.warn('Claude error', res.status, (await res.text()).slice(0, 300)); throw httpError(502, 'The AI could not read the photo. Pick the part from the list.'); }
  const j = await res.json();
  return parseJSON((j.content || []).filter(c => c.type === 'text').map(c => c.text).join(''));
}

async function identify(body, fetchImpl = fetch) {
  const mime = body.mime_type;
  const b64 = body.image_base64;
  if (!MIME_TYPES.includes(mime)) throw httpError(400, 'mime_type must be image/jpeg, image/png or image/webp');
  if (typeof b64 !== 'string' || b64.length < 100 || !/^[A-Za-z0-9+/]+={0,2}$/.test(b64)) throw httpError(400, 'image_base64 must be a base64-encoded image');
  if (Math.floor(b64.length * 3 / 4) > MAX_IMAGE_BYTES) throw httpError(413, 'The photo is too large (4 MB at most)');
  const p = provider();
  if (!p) throw httpError(503, 'The photo check is not switched on for this site yet. Pick the part from the list.');
  let raw;
  try { raw = p === 'gemini' ? await callGemini(b64, mime, fetchImpl) : await callClaude(b64, mime, fetchImpl); }
  catch (e) {
    if (e.status) throw e;
    console.warn('AI call failed', e && e.name, e && e.message);
    throw httpError(504, 'The AI took too long. Try again, or pick the part from the list.');
  }
  return Object.assign({ provider: p }, normalize(raw && typeof raw === 'object' ? raw : {}));
}

module.exports = { identify, provider, normalize, parseJSON, prompt, GEMINI_MODELS, CLAUDE_MODEL };
