const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

// Migration script to add delivery_id column and relationship
async function runMigration() {
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
  });

  try {
    console.log('Starting delivery_id migration...');
    
    // Path to migration file
    const migrationPath = path.join(__dirname, 'migrations', 'add-delivery-id-column.sql');
    
    // Read the migration file
    const migration = fs.readFileSync(migrationPath, 'utf8');
    
    // Execute the migration
    await pool.query(migration);
    
    console.log('Migration completed successfully!');
    
    // Check if the migration worked correctly
    console.log('Testing delivery_id column...');
    
    const deliveryRequestsResult = await pool.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'delivery_requests' 
      AND column_name = 'delivery_id'
    `);
    
    console.log(`Delivery requests delivery_id column check: ${deliveryRequestsResult.rows.length > 0 ? 'PASSED' : 'FAILED'}`);
    
    // Check relationships
    const relationshipResult = await pool.query(`
      SELECT dr.id, dr.delivery_id, d.id as delivery_id, d.request_id
      FROM delivery_requests dr
      JOIN deliveries d ON dr.id = d.request_id
      WHERE dr.delivery_id IS NULL
      LIMIT 5
    `);
    
    if (relationshipResult.rows.length > 0) {
      console.log('WARNING: Some relationships may not be properly set. Examples:');
      console.table(relationshipResult.rows);
    } else {
      console.log('All existing relationships correctly updated!');
    }
    
  } catch (err) {
    console.error('Migration failed:', err);
  } finally {
    await pool.end();
  }
}

runMigration(); 