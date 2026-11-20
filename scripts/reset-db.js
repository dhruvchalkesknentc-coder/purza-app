// Deletes the local database file so the next start re-creates it with fresh collected data.
const fs = require('node:fs');
const path = require('node:path');
const file = process.env.PURZA_DB || path.join(__dirname, '..', 'data', 'purza.db');
for (const f of [file, file + '-wal', file + '-shm']) if (fs.existsSync(f)) { fs.unlinkSync(f); console.log('deleted', f); }
console.log('Done. Start the server to create a fresh database.');
