-- Purza database schema (SQLite). The app applies it on start; see schema.postgres.sql for the same tables in PostgreSQL.
-- Phase 1: appliance parts from shops in Lohar Chawl / Lamington Road.
-- Phase 2: car parts by Year / Make / Model (Vehicles, Categories, Parts, Fitments from the architecture document).

PRAGMA foreign_keys = ON;

-- ---------- reference data ----------
CREATE TABLE IF NOT EXISTS categories (
  code TEXT PRIMARY KEY,               -- ac, fan, mixer, washer, geyser, fridge, general
  name TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS appliance_parts (
  id          TEXT PRIMARY KEY,        -- e.g. ac-capacitor
  name        TEXT NOT NULL,
  short_name  TEXT NOT NULL,
  local_name  TEXT NOT NULL DEFAULT '',
  category    TEXT NOT NULL REFERENCES categories(code),
  appliance   TEXT NOT NULL DEFAULT '',
  check_note  TEXT NOT NULL DEFAULT '',
  keywords    TEXT NOT NULL DEFAULT '' -- '|' separated, used by part search
);

-- Prices seen online for each part (brand price lists, marketplaces, trade listings), with the source link.
CREATE TABLE IF NOT EXISTS price_listings (
  id           INTEGER PRIMARY KEY,
  part_id      TEXT NOT NULL REFERENCES appliance_parts(id),
  description  TEXT NOT NULL,
  price_inr    INTEGER NOT NULL CHECK (price_inr > 0),
  kind         TEXT NOT NULL CHECK (kind IN ('genuine', 'compatible', 'trade')),
  source_name  TEXT NOT NULL,
  source_url   TEXT NOT NULL,
  collected_on TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_price_listings_part ON price_listings(part_id);

-- Real businesses from public directories. NOT Purza partners: the sign-up list.
CREATE TABLE IF NOT EXISTS public_listings (
  id          INTEGER PRIMARY KEY,
  name        TEXT NOT NULL,
  market      TEXT NOT NULL,
  address     TEXT NOT NULL,
  sells       TEXT NOT NULL,
  source_name TEXT NOT NULL,
  source_url  TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS facts (
  id     INTEGER PRIMARY KEY,
  grp    TEXT NOT NULL,
  stat   TEXT NOT NULL,
  label  TEXT NOT NULL,
  detail TEXT NOT NULL,
  source TEXT NOT NULL,
  url    TEXT NOT NULL
);

-- ---------- marketplace ----------
CREATE TABLE IF NOT EXISTS shops (
  id         TEXT PRIMARY KEY,
  name       TEXT NOT NULL,
  shop_no    TEXT NOT NULL DEFAULT '',
  market     TEXT NOT NULL,
  demo       INTEGER NOT NULL DEFAULT 0, -- 1 = invented demo shop that auto-replies
  token_hash TEXT,                       -- sha256 of the shop's secret token; NULL for demo shops
  created_at INTEGER NOT NULL            -- unix ms
);

CREATE TABLE IF NOT EXISTS shop_categories (
  shop_id  TEXT NOT NULL REFERENCES shops(id) ON DELETE CASCADE,
  category TEXT NOT NULL REFERENCES categories(code),
  PRIMARY KEY (shop_id, category)
);

CREATE TABLE IF NOT EXISTS requests (
  id                TEXT PRIMARY KEY,
  part_id           TEXT REFERENCES appliance_parts(id), -- NULL for a part described in words
  part_name         TEXT NOT NULL,
  category          TEXT NOT NULL REFERENCES categories(code),
  local_name        TEXT NOT NULL DEFAULT '',
  appliance         TEXT NOT NULL DEFAULT '',
  check_note        TEXT NOT NULL DEFAULT '',
  persona           TEXT NOT NULL CHECK (persona IN ('tech', 'home')),
  prefer            TEXT NOT NULL CHECK (prefer IN ('genuine', 'cheap', 'fast')),
  delivery          TEXT NOT NULL CHECK (delivery IN ('pickup', 'deliver')),
  area              TEXT NOT NULL DEFAULT '',
  sticker           TEXT NOT NULL DEFAULT '',
  note              TEXT NOT NULL DEFAULT '',
  max_price_inr     INTEGER,
  via               TEXT NOT NULL DEFAULT 'person' CHECK (via IN ('person', 'agent')),
  demo_shops_asked  INTEGER NOT NULL DEFAULT 0,
  buyer_token_hash  TEXT NOT NULL,
  status            TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'reserved', 'paid', 'cancelled')),
  created_at        INTEGER NOT NULL,
  reserved_shop_id  TEXT REFERENCES shops(id),
  pickup_code       TEXT,
  part_price_inr    INTEGER,
  fee_inr           INTEGER,
  delivery_inr      INTEGER,
  total_inr         INTEGER,
  reserved_at       INTEGER,
  paid_at           INTEGER,
  payment_ref       TEXT
);
CREATE INDEX IF NOT EXISTS idx_requests_status ON requests(status, created_at);

-- One reply per shop per request. Demo replies are written when the request is created and revealed at reveal_at.
CREATE TABLE IF NOT EXISTS offers (
  id            INTEGER PRIMARY KEY,
  request_id    TEXT NOT NULL REFERENCES requests(id) ON DELETE CASCADE,
  shop_id       TEXT NOT NULL REFERENCES shops(id) ON DELETE CASCADE,
  status        TEXT NOT NULL CHECK (status IN ('yes', 'no')),
  type          TEXT CHECK (type IN ('genuine', 'compatible')),
  price_inr     INTEGER CHECK (price_inr IS NULL OR price_inr > 0),
  warranty_days INTEGER,
  ready_min     INTEGER,
  reveal_at     INTEGER NOT NULL,
  created_at    INTEGER NOT NULL,
  UNIQUE (request_id, shop_id)
);
CREATE INDEX IF NOT EXISTS idx_offers_request ON offers(request_id);

-- ---------- phase 2: car parts (tables as in the architecture document) ----------
CREATE TABLE IF NOT EXISTS vehicles (
  id    INTEGER PRIMARY KEY,
  year  INTEGER NOT NULL,
  make  TEXT NOT NULL,
  model TEXT NOT NULL,
  trim  TEXT NOT NULL DEFAULT ''
);
CREATE INDEX IF NOT EXISTS idx_vehicles_ymm ON vehicles(year, make, model);

CREATE TABLE IF NOT EXISTS car_categories (
  id   INTEGER PRIMARY KEY,
  name TEXT NOT NULL UNIQUE
);

CREATE TABLE IF NOT EXISTS car_parts (
  id          INTEGER PRIMARY KEY,
  part_number TEXT NOT NULL UNIQUE,
  name        TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  brand       TEXT NOT NULL DEFAULT '',
  price       INTEGER,                   -- NULL in the sample catalogue
  category_id INTEGER REFERENCES car_categories(id)
);

CREATE TABLE IF NOT EXISTS fitments (
  part_id    INTEGER NOT NULL REFERENCES car_parts(id) ON DELETE CASCADE,
  vehicle_id INTEGER NOT NULL REFERENCES vehicles(id) ON DELETE CASCADE,
  PRIMARY KEY (part_id, vehicle_id)
);
CREATE INDEX IF NOT EXISTS idx_fitments_vehicle ON fitments(vehicle_id);
