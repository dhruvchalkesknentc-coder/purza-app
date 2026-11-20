// Writes the collected research as CSV and JSON files you can open in Excel or Google Sheets.
const fs = require('node:fs');
const path = require('node:path');
const D = require('../data/data.js');
const out = path.join(__dirname, '..', 'data');
const cell = v => { const s = v == null ? '' : String(v); return /[",\n]/.test(s) ? '"' + s.replace(/"/g, '""') + '"' : s; };
const csv = (file, header, rows) => { fs.writeFileSync(path.join(out, file), '﻿' + [header, ...rows].map(r => r.map(cell).join(',')).join('\n') + '\n'); console.log('wrote data/' + file, rows.length, 'rows'); };
csv('part-prices.csv', ['part_id', 'part', 'appliance', 'category', 'listing', 'price_inr', 'kind', 'source', 'url', 'collected_on'],
  D.PARTS.flatMap(p => p.obs.map(o => [p.id, p.name, p.appliance, D.CATEGORIES[p.cat], o.what, o.price, o.kind, o.where, o.url, D.COLLECTED_ON])));
csv('public-shop-listings.csv', ['name', 'market', 'address', 'sells', 'source', 'url', 'status'],
  D.PUBLIC_LISTINGS.map(l => [l.name, l.market, l.address, l.sells, l.source, l.url, 'Public listing, not a Purza partner']));
csv('market-facts.csv', ['group', 'stat', 'label', 'detail', 'source', 'url'], D.FACTS.map(f => [f.group, f.stat, f.label, f.detail, f.source, f.url]));
csv('demo-shops.csv', ['id', 'name', 'shop_no', 'market', 'stocks', 'note'], D.DEMO_SHOPS.map(s => [s.id, s.name, s.shopNo, s.market, s.cats.map(c => D.CATEGORIES[c]).join('; '), 'Invented for the demo']));
fs.writeFileSync(path.join(out, 'purza-data.json'), JSON.stringify(D, null, 2));
console.log('wrote data/purza-data.json');
