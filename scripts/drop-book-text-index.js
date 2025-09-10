// One-time maintenance script to drop the old text index that used language override
// Run with: node scripts/drop-book-text-index.js
let dotenvLoaded = false;
try { require('dotenv').config(); dotenvLoaded = true; } catch {}
if (!dotenvLoaded) {
  // Minimal .env loader
  const fs = require('fs');
  const path = require('path');
  try {
    const envPath = path.resolve(process.cwd(), '.env');
    const content = fs.readFileSync(envPath, 'utf8');
    content.split(/\r?\n/).forEach((line) => {
      if (!line || line.trim().startsWith('#')) return;
      const idx = line.indexOf('=');
      if (idx === -1) return;
      const key = line.slice(0, idx).trim();
      let val = line.slice(idx + 1).trim();
      if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
        val = val.slice(1, -1);
      }
      if (!(key in process.env)) process.env[key] = val;
    });
  } catch {}
}
const mongoose = require('mongoose');

async function run() {
  const uri = process.env.MONGODB_URI || process.env.DATABASE_URL || process.env.MONGO_URI;
  if (!uri) {
    console.error('MONGODB_URI env not set');
    process.exit(1);
  }
  await mongoose.connect(uri);
  const db = mongoose.connection.db;
  const collection = db.collection('books');
  try {
    const indexes = await collection.indexes();
    const textIndex = indexes.find((i) => i.key && i.key._fts === 'text');
    if (textIndex) {
      console.log('Dropping text index:', textIndex.name);
      await collection.dropIndex(textIndex.name);
      console.log('Dropped.');
    } else {
      console.log('No text index found.');
    }
  } catch (e) {
    console.error('Error dropping index:', e);
  } finally {
    await mongoose.disconnect();
  }
}

run();
