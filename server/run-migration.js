const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

async function runMigration() {
  try {
    console.log('Starting migration...');
    const pool = new Pool({
      connectionString: process.env.DATABASE_URL
    });

    const migrationPath = path.join(__dirname, 'migrations', 'add-archive-columns.sql');
    console.log(`Reading migration file: ${migrationPath}`);
    
    // Check if the file exists
    if (!fs.existsSync(migrationPath)) {
      console.error(`Migration file not found: ${migrationPath}`);
      process.exit(1);
    }
    
    const sql = fs.readFileSync(migrationPath, 'utf8');
    console.log('Migration SQL loaded successfully');
    
    console.log('Executing migration...');
    await pool.query(sql);
    
    console.log('Migration completed successfully');
    
    // Test query to check if the columns were added
    console.log('Testing archive columns...');
    const deliveriesResult = await pool.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'deliveries' 
      AND column_name = 'is_archived'
    `);
    
    const requestsResult = await pool.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'delivery_requests' 
      AND column_name = 'is_archived'
    `);
    
    console.log(`Deliveries archive column check: ${deliveriesResult.rows.length > 0 ? 'PASSED' : 'FAILED'}`);
    console.log(`Requests archive column check: ${requestsResult.rows.length > 0 ? 'PASSED' : 'FAILED'}`);
    
    process.exit(0);
  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  }
}

runMigration(); 