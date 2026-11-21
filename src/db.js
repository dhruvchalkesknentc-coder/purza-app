'use strict';
// Opens the SQLite database, applies db/schema.sql, and loads the collected data the first time.
const fs = require('node:fs');
const path = require('node:path');
const { DatabaseSync } = require('node:sqlite');
const D = require('../data/data.js');

const SCHEMA = fs.readFileSync(path.join(__dirname, '..', 'db', 'schema.sql'), 'utf8');

function openDb(file) {
  if (file !== ':memory:') fs.mkdirSync(path.dirname(path.resolve(file)), { recursive: true });
  const db = new DatabaseSync(file);
  if (file !== ':memory:') db.exec('PRAGMA journal_mode = WAL;');
  db.exec(SCHEMA);
  const seeded = db.prepare('SELECT COUNT(*) AS n FROM appliance_parts').get().n > 0;
  if (!seeded) seed(db);
  return db;
}

function tx(db, fn) {
  db.exec('BEGIN');
  try { fn(); db.exec('COMMIT'); } catch (e) { db.exec('ROLLBACK'); throw e; }
}

function seed(db) {
  tx(db, () => {
    const cat = db.prepare('INSERT INTO categories (code, name) VALUES (?, ?)');
    for (const [code, name] of Object.entries(D.CATEGORIES)) cat.run(code, name);
    cat.run('general', 'Other');

    const part = db.prepare('INSERT INTO appliance_parts (id, name, short_name, local_name, category, appliance, check_note, keywords) VALUES (?, ?, ?, ?, ?, ?, ?, ?)');
    const obs = db.prepare('INSERT INTO price_listings (part_id, description, price_inr, kind, source_name, source_url, collected_on) VALUES (?, ?, ?, ?, ?, ?, ?)');
    for (const p of D.PARTS) {
      part.run(p.id, p.name, p.short, p.local, p.cat, p.appliance, p.check, p.keywords.join('|'));
      for (const o of p.obs) obs.run(p.id, o.what, o.price, o.kind, o.where, o.url, D.COLLECTED_ON);
    }

    const shop = db.prepare('INSERT INTO shops (id, name, shop_no, market, demo, token_hash, created_at) VALUES (?, ?, ?, ?, 1, NULL, ?)');
    const shopCat = db.prepare('INSERT INTO shop_categories (shop_id, category) VALUES (?, ?)');
    for (const s of D.DEMO_SHOPS) {
      shop.run(s.id, s.name, s.shopNo, s.market, 0);
      for (const c of s.cats) shopCat.run(s.id, c);
    }

    const pl = db.prepare('INSERT INTO public_listings (name, market, zone, address, sells, source_name, source_url) VALUES (?, ?, ?, ?, ?, ?, ?)');
    for (const l of D.PUBLIC_LISTINGS) pl.run(l.name, l.market, l.zone, l.address, l.sells, l.source, l.url);

    const fact = db.prepare('INSERT INTO facts (grp, stat, label, detail, source, url) VALUES (?, ?, ?, ?, ?, ?)');
    for (const f of D.FACTS) fact.run(f.group, f.stat, f.label, f.detail, f.source, f.url);

    const veh = db.prepare('INSERT INTO vehicles (id, year, make, model, trim) VALUES (?, ?, ?, ?, ?)');
    for (const v of D.CAR_VEHICLES) veh.run(v.id, v.year, v.make, v.model, v.trim);
    const ccat = db.prepare('INSERT INTO car_categories (name) VALUES (?)');
    const ccatId = new Map();
    for (const name of [...new Set(D.CAR_PARTS.map(p => p.category))]) ccatId.set(name, Number(ccat.run(name).lastInsertRowid));
    const cp = db.prepare('INSERT INTO car_parts (id, part_number, name, description, brand, price, category_id) VALUES (?, ?, ?, ?, ?, NULL, ?)');
    const fit = db.prepare('INSERT INTO fitments (part_id, vehicle_id) VALUES (?, ?)');
    for (const p of D.CAR_PARTS) {
      cp.run(p.id, p.part_number, p.name, 'Sample catalogue entry', p.brand, ccatId.get(p.category));
      for (const v of p.fits) fit.run(p.id, v);
    }
  });
}

module.exports = { openDb, tx };
