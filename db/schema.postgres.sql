-- Purza schema for PostgreSQL (for when you move off SQLite). Same tables as schema.sql.
-- Times are kept as unix milliseconds (BIGINT) so the app code does not change.

CREATE TABLE IF NOT EXISTS categories (code TEXT PRIMARY KEY, name TEXT NOT NULL);

CREATE TABLE IF NOT EXISTS appliance_parts (
  id TEXT PRIMARY KEY, name TEXT NOT NULL, short_name TEXT NOT NULL, local_name TEXT NOT NULL DEFAULT '',
  category TEXT NOT NULL REFERENCES categories(code), appliance TEXT NOT NULL DEFAULT '',
  check_note TEXT NOT NULL DEFAULT '', keywords TEXT NOT NULL DEFAULT ''
);

CREATE TABLE IF NOT EXISTS price_listings (
  id SERIAL PRIMARY KEY, part_id TEXT NOT NULL REFERENCES appliance_parts(id), description TEXT NOT NULL,
  price_inr INTEGER NOT NULL CHECK (price_inr > 0), kind TEXT NOT NULL CHECK (kind IN ('genuine', 'compatible', 'trade')),
  source_name TEXT NOT NULL, source_url TEXT NOT NULL, collected_on DATE NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_price_listings_part ON price_listings(part_id);

CREATE TABLE IF NOT EXISTS public_listings (
  id SERIAL PRIMARY KEY, name TEXT NOT NULL, market TEXT NOT NULL, address TEXT NOT NULL, sells TEXT NOT NULL,
  source_name TEXT NOT NULL, source_url TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS facts (
  id SERIAL PRIMARY KEY, grp TEXT NOT NULL, stat TEXT NOT NULL, label TEXT NOT NULL, detail TEXT NOT NULL,
  source TEXT NOT NULL, url TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS shops (
  id TEXT PRIMARY KEY, name TEXT NOT NULL, shop_no TEXT NOT NULL DEFAULT '', market TEXT NOT NULL,
  demo BOOLEAN NOT NULL DEFAULT FALSE, token_hash TEXT, created_at BIGINT NOT NULL
);

CREATE TABLE IF NOT EXISTS shop_categories (
  shop_id TEXT NOT NULL REFERENCES shops(id) ON DELETE CASCADE, category TEXT NOT NULL REFERENCES categories(code),
  PRIMARY KEY (shop_id, category)
);

CREATE TABLE IF NOT EXISTS requests (
  id TEXT PRIMARY KEY, part_id TEXT REFERENCES appliance_parts(id), part_name TEXT NOT NULL,
  category TEXT NOT NULL REFERENCES categories(code), local_name TEXT NOT NULL DEFAULT '', appliance TEXT NOT NULL DEFAULT '',
  check_note TEXT NOT NULL DEFAULT '',
  persona TEXT NOT NULL CHECK (persona IN ('tech', 'home')), prefer TEXT NOT NULL CHECK (prefer IN ('genuine', 'cheap', 'fast')),
  delivery TEXT NOT NULL CHECK (delivery IN ('pickup', 'deliver')), area TEXT NOT NULL DEFAULT '', sticker TEXT NOT NULL DEFAULT '',
  note TEXT NOT NULL DEFAULT '', max_price_inr INTEGER, via TEXT NOT NULL DEFAULT 'person' CHECK (via IN ('person', 'agent')),
  demo_shops_asked INTEGER NOT NULL DEFAULT 0, buyer_token_hash TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'reserved', 'paid', 'cancelled')),
  created_at BIGINT NOT NULL, reserved_shop_id TEXT REFERENCES shops(id), pickup_code TEXT,
  part_price_inr INTEGER, fee_inr INTEGER, delivery_inr INTEGER, total_inr INTEGER,
  reserved_at BIGINT, paid_at BIGINT, payment_ref TEXT
);
CREATE INDEX IF NOT EXISTS idx_requests_status ON requests(status, created_at);

CREATE TABLE IF NOT EXISTS offers (
  id SERIAL PRIMARY KEY, request_id TEXT NOT NULL REFERENCES requests(id) ON DELETE CASCADE,
  shop_id TEXT NOT NULL REFERENCES shops(id) ON DELETE CASCADE, status TEXT NOT NULL CHECK (status IN ('yes', 'no')),
  type TEXT CHECK (type IN ('genuine', 'compatible')), price_inr INTEGER CHECK (price_inr IS NULL OR price_inr > 0),
  warranty_days INTEGER, ready_min INTEGER, reveal_at BIGINT NOT NULL, created_at BIGINT NOT NULL,
  UNIQUE (request_id, shop_id)
);
CREATE INDEX IF NOT EXISTS idx_offers_request ON offers(request_id);

-- Phase 2: car parts (Vehicles, Categories, Parts, Fitments from the architecture document)
CREATE TABLE IF NOT EXISTS vehicles (id SERIAL PRIMARY KEY, year INTEGER NOT NULL, make TEXT NOT NULL, model TEXT NOT NULL, trim TEXT NOT NULL DEFAULT '');
CREATE INDEX IF NOT EXISTS idx_vehicles_ymm ON vehicles(year, make, model);
CREATE TABLE IF NOT EXISTS car_categories (id SERIAL PRIMARY KEY, name TEXT NOT NULL UNIQUE);
CREATE TABLE IF NOT EXISTS car_parts (
  id SERIAL PRIMARY KEY, part_number TEXT NOT NULL UNIQUE, name TEXT NOT NULL, description TEXT NOT NULL DEFAULT '',
  brand TEXT NOT NULL DEFAULT '', price INTEGER, category_id INTEGER REFERENCES car_categories(id)
);
CREATE TABLE IF NOT EXISTS fitments (
  part_id INTEGER NOT NULL REFERENCES car_parts(id) ON DELETE CASCADE,
  vehicle_id INTEGER NOT NULL REFERENCES vehicles(id) ON DELETE CASCADE,
  PRIMARY KEY (part_id, vehicle_id)
);
CREATE INDEX IF NOT EXISTS idx_fitments_vehicle ON fitments(vehicle_id);
