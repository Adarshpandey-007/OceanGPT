const { Pool } = require('pg');
const fs = require('fs');
require('dotenv').config({path: '.env'});

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

async function runMigration() {
  const sql = fs.readFileSync('docs/platform_vision/schema_v0.7.0.sql', 'utf8');
  try {
    await pool.query(sql);
    console.log('Migration v0.7.0 successful');
  } catch (err) {
    console.error('Migration failed:', err);
  } finally {
    pool.end();
  }
}

runMigration();
