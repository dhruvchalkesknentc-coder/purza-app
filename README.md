# Purza

Purza asks every appliance spare-parts shop across Mumbai at once: Lohar Chawl and Lamington Road, and the suburbs from Andheri and Kandivali to Kurla, Thane and Vashi. A technician or household names the part (or describes what's broken); shops reply in a tap with the price, genuine or compatible, warranty and ready time; the buyer reserves the best offer and pays by UPI. AI agents can do the same through the API.

This package is the full working app: website, REST API, database and the research data.

## Run it

You need **Node.js 22.13 or newer** (it uses the built-in `node:sqlite`). Nothing to install from npm.

```bash
npm start            # http://localhost:3000
npm test             # 22 tests: API flow, photo check, security checks, business rules
```

- **Try it on two devices:** start the server on your laptop and open `http://<your-laptop-ip>:3000/#shop` on your phone (same Wi-Fi). Add a shop on the phone, post a request from the laptop, reply from the phone.
- **Fresh start:** `npm run reset-db` deletes the local database; the next start reloads the collected data.
- **Docker:** `docker build -t purza . && docker run -p 3000:3000 -v purza-data:/data purza`
- Settings (all optional) are in `.env.example`: `PORT`, `PURZA_DB`, `CORS_ORIGIN`, rate limits, `PAYMENTS_MODE`, and the AI keys below.

## Photo check (AI)

A buyer can add a photo and AI works out which part it is. Set one key on the server and the "Add a photo" button appears:

- `GEMINI_API_KEY`: free key from Google AI Studio (aistudio.google.com/apikey). Uses `gemini-3.5-flash-lite`, then `gemini-3.1-flash-lite` if the first is retired; change with `GEMINI_MODEL`. On the free tier Google may use what you send to improve its products.
- `ANTHROPIC_API_KEY`: Claude key from console.anthropic.com (paid). Uses `claude-haiku-5-5`; change with `ANTHROPIC_MODEL`.

Photos are shrunk on the phone, sent once for the check and not stored. `POST /api/identify` is limited to 6 checks a minute per visitor (`IDENTIFY_PER_MINUTE`) to protect the free quota.

## Copilot (AI)

The "Ask Copilot" button in the corner opens a chat that runs the demo with you. It answers from the live data and can drive the site: ask the market for a part (offers arrive on the Find tab), read and reserve offers, look up shops in any Mumbai area, pull prices with sources, and switch tabs so the audience sees what it is talking about.

- Runs on **Claude** when `ANTHROPIC_API_KEY` is set (model `claude-sonnet-5-5`; change with `ANTHROPIC_AGENT_MODEL`).
- Otherwise runs on the free Gemini key (`GEMINI_API_KEY`), and the panel says "Gemini".
- With neither key, the button stays hidden.

`POST /api/agent` takes `{ "view": "find", "messages": [{ "role": "user", "text": "..." }] }` and returns `{ reply, actions, tools_used, provider, model }`. It is limited to 15 messages a minute per visitor (`AGENT_PER_MINUTE`). The agent can only reserve requests it posted itself, and payments stay in demo mode.

## What's inside

```
src/server.js       API + static website (node:http), security headers, rate limits, input checks
src/db.js           opens SQLite, applies the schema, loads the collected data on first run
src/logic.js        business rules: fees, ranking, price checks, demo-shop replies, part search
src/payments.js     UPI payment step (demo mode until a gateway is connected)
src/identify.js     photo check: Gemini (free tier) or Claude works out the part from a photo
src/agent.js        Purza Copilot: Claude (or Gemini) chat agent with tools over the live data
db/schema.sql       SQLite schema used by the app
db/schema.postgres.sql  the same tables for PostgreSQL
public/             the website: Find a part, Shop desk, Price guide, Markets, AI buyers, Car parts preview
data/data.js        all collected research, with a source link on every row
data/*.csv          the same research for Excel / Google Sheets (regenerate: npm run export-data)
test/               node:test suites
```

## How it maps to the architecture document

| Architecture document | This package | Why |
|---|---|---|
| React (Create React App) frontend | Plain HTML, CSS and JavaScript in `public/` | No build step; runs on any laptop at the hackathon, even offline |
| Node.js + Express | Node.js `node:http` | Same routes, zero dependencies to install |
| Sequelize + PostgreSQL / SQLite | `node:sqlite` with prepared statements; `schema.postgres.sql` for later | Parameterized SQL everywhere, so no SQL injection |
| Vehicles, Categories, Parts, Fitments tables | `vehicles`, `car_categories`, `car_parts`, `fitments` | Car phase, as designed |
| `GET /api/search?part&year&make&model` | Same endpoint | Car parts preview on a sample catalogue |
| `GET /api/categories`, `GET /api/vehicles` | Same endpoints | |
| Jest + Supertest | `node:test` + `fetch` | Built into Node |
| helmet, CORS | Security headers (CSP, frame, referrer, nosniff) and configurable CORS | Set in `server.js` |
| WCAG 2.2 | Labelled forms, keyboard focus styles, live regions, colour contrast | |
| Seed data (Camry, Civic, F-150) | Indian cars (Swift, Creta, City, Nexon, Bolero) | Sample only |

Phase 1 adds the appliance tables the pitch needs: `appliance_parts`, `price_listings`, `shops`, `shop_categories`, `requests`, `offers`, `public_listings`, `facts`.

## API

Base: `http://localhost:3000`. Full list at `GET /api`; plain-English guide for AI assistants at `GET /llms.txt`.

| Endpoint | Who | What |
|---|---|---|
| `GET /api/parts?q=geyser not heating` | anyone | parts matching a plain description, with prices listed online |
| `POST /api/requests` | buyer or agent | ask every matching shop; returns `request.id` and a `buyer_token` |
| `GET /api/requests/:id` | anyone with the id | replies, offers ranked best first, price check, fees |
| `POST /api/requests/:id/reserve` `{shop_id}` | buyer token | hold the offer, pickup code, payment link |
| `POST /api/requests/:id/pay` / `cancel` | buyer token | demo payment / cancel |
| `POST /api/shops` | shop | sign up; returns a `shop_token` |
| `GET /api/shop/inbox` | shop token | open requests for the shop's parts, and its orders |
| `POST /api/requests/:id/offers` | shop token | `{status:"yes", type, price_inr, warranty_days, ready_in_min}` or `{status:"no"}` |
| `GET /api/listings`, `/api/facts`, `/api/shops` | anyone | research data and registered shops |
| `GET /api/search`, `/api/vehicles` | anyone | car parts preview |

Tokens go in the header `Authorization: Bearer <token>`. They are stored hashed (SHA-256).

## The data

Collected on 20–21 Nov 2026 from public Mumbai web pages (Mumbai sellers, plus brand list prices and online stores that deliver in Mumbai). Every row in `data/` has its source link.

- **Part prices (real):** 67 listed prices for 15 common appliance parts (AC and fan capacitors, mixer couplers and jars, washing machine pumps, motors, valves and timers, geyser elements and thermostats, fridge timers, thermostats and relays, AC motors and blowers) mostly from Mumbai sellers on IndiaMART (shop and area on each row), plus Havells, Flipkart, Moglix and Aalap. Genuine, compatible and trade prices are kept apart.
- **Shops (real, not partners):** 72 businesses from public directories and store locators across 30 Mumbai areas (63 areas in six zones are listed for buyers and shops), from Lohar Chawl and Lamington Road to Andheri, Kandivali, Borivali, Kurla, Ghatkopar, Chembur, Thane and Vashi. `GET /api/listings?area=Kandivali` returns the shops in or nearest to an area. Phone numbers and owners' names were left out on purpose. They have not joined Purza.
- **Market facts (real):** 14 figures with sources: AI shopping in India, WhatsApp use, UPI volumes, AC ownership and sales, repair market size, Urban Company, the two markets, the Right to Repair portal, the car aftermarket.
- **Demo (invented):** 14 shops that auto-reply so every request gets answers while real shops join. Their prices are drawn from the real price ranges. They are labelled "demo" everywhere.
- **Sample:** the car catalogue (placeholder part numbers, no prices).

## Going live

1. **Payments.** Replace `createPaymentLink()` in `src/payments.js` with a Razorpay or Cashfree payment-link call, and mark orders paid from the gateway's signed webhook instead of `/pay`. Set `PAYMENTS_MODE=live`.
2. **Shop sign-in.** Swap the shop token for phone-number OTP login, and send new requests to shops on WhatsApp (Business API) so they can reply without opening the site.
3. **Photos for shops.** The photo check is built in; next, keep the buyer's photo so shops can see it too (needs file storage such as S3 or Cloudinary).
4. **Hosting.** Any Node host with a persistent disk (Railway, Render, Fly.io, a small VPS). Move to PostgreSQL with `db/schema.postgres.sql` when you run more than one server.
5. **Car parts.** License a fitment catalogue (ACES-style data) before the car phase.

Built for the Stripe Community Mumbai × SP Jain hackathon.
