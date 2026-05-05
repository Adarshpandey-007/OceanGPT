import { query } from './src/lib/db';
import * as fs from 'fs';

async function runMigration() {
  const sql = fs.readFileSync('docs/platform_vision/schema_v0.6.0.sql', 'utf8');
  try {
    await query(sql);
    console.log('Migration successful');
  } catch (err) {
    console.error('Migration failed:', err);
  } finally {
    process.exit();
  }
}

runMigration();
