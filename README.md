# Purza

Purza asks every appliance spare-parts shop in Mumbai's Lohar Chawl and Lamington Road at once. A technician or household names the part (or describes what's broken); shops reply in a tap with the price, genuine or compatible, warranty and ready time; the buyer reserves the best offer and pays by UPI. AI agents can do the same through the API.

This package is the full working app: website, REST API, database and the research data.

## Run it

You need **Node.js 22.13 or newer** (it uses the built-in `node:sqlite`). Nothing to install from npm.

```bash
npm start            # http://localhost:3000
npm test             # 15 tests: API flow, security checks, business rules
```

- **Try it on two devices:** start the server on your laptop and open `http://<your-laptop-ip>:3000/#shop` on your phone (same Wi-Fi). Add a shop on the phone, post a request from the laptop, reply from the phone.
- **Fresh start:** `npm run reset-db` deletes the local database; the next start reloads the collected data.
- **Docker:** `docker build -t purza . && docker run -p 3000:3000 -v purza-data:/data purza`
- Settings (all optional) are in `.env.example`: `PORT`, `PURZA_DB`, `CORS_ORIGIN`, rate limits, `PAYMENTS_MODE`.

## What's inside

```
src/server.js       API + static website (node:http), security headers, rate limits, input checks
src/db.js           opens SQLite, applies the schema, loads the collected data on first run
src/logic.js        business rules: fees, ranking, price checks, demo-shop replies, part search
src/payments.js     UPI payment step (demo mode until a gateway is connected)
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

Collected on 20 Nov 2026 from public web pages. Every row in `data/` has its source link.

- **Part prices (real):** 46 listed prices for 15 common appliance parts (AC and fan capacitors, mixer couplers and jars, washing machine pumps, motors, valves and timers, geyser elements and thermostats, fridge timers, thermostats and relays, AC motors and blowers) from Havells, Flipkart, IndiaMART, Moglix, Aalap and others. Genuine, compatible and trade prices are kept apart.
- **Shops (real, not partners):** 22 businesses from public directories and store locators in Lohar Chawl, Lamington Road, Grant Road and elsewhere in Mumbai. Phone numbers and owners' names were left out on purpose. They have not joined Purza.
- **Market facts (real):** 14 figures with sources: AI shopping in India, WhatsApp use, UPI volumes, AC ownership and sales, repair market size, Urban Company, the two markets, the Right to Repair portal, the car aftermarket.
- **Demo (invented):** 14 shops that auto-reply so every request gets answers while real shops join. Their prices are drawn from the real price ranges. They are labelled "demo" everywhere.
- **Sample:** the car catalogue (placeholder part numbers, no prices).

## Going live

1. **Payments.** Replace `createPaymentLink()` in `src/payments.js` with a Razorpay or Cashfree payment-link call, and mark orders paid from the gateway's signed webhook instead of `/pay`. Set `PAYMENTS_MODE=live`.
2. **Shop sign-in.** Swap the shop token for phone-number OTP login, and send new requests to shops on WhatsApp (Business API) so they can reply without opening the site.
3. **Photos and AI.** Add photo upload and a vision model to identify the part from a picture (the hosted demo does this).
4. **Hosting.** Any Node host with a persistent disk (Railway, Render, Fly.io, a small VPS). Move to PostgreSQL with `db/schema.postgres.sql` when you run more than one server.
5. **Car parts.** License a fitment catalogue (ACES-style data) before the car phase.

Built for the Stripe Community Mumbai × SP Jain hackathon.
