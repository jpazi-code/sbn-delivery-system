const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

// Create a connection pool to the database
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false // Required for external connections in Vercel
  },
  max: 5, // Reduce connections for serverless environment
  idleTimeoutMillis: 30000, // 30 second timeout
  connectionTimeoutMillis: 5000, // 5 second timeout for faster failures
  keepAlive: true // Enable TCP keepalive
});

// Add event listeners for connection issues
pool.on('error', (err, client) => {
  console.error('Unexpected error on idle client', err);
  // Attempt to reconnect on connection errors
  if (err.code === 'PROTOCOL_CONNECTION_LOST') {
    console.log('Lost connection to the database. Attempting to reconnect...');
    pool.connect()
      .then(() => console.log('Successfully reconnected to database'))
      .catch(reconnectErr => console.error('Failed to reconnect:', reconnectErr));
  }
});

// Add connection error handling
pool.on('connect', (client) => {
  client.on('error', (err) => {
    console.error('Database client error:', err);
  });
});

// Test the database connection
pool.connect()
  .then(() => console.log('Connected to PostgreSQL database'))
  .catch(err => console.error('Database connection error:', err.stack));

// Function to initialize the database schema
const initializeSchema = async () => {
  try {
    console.log('Starting database schema initialization...');
    
    // Check if the database is already initialized
    const tableCheck = await pool.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'users'
      );
    `);
    
    const tablesExist = tableCheck.rows[0].exists;
    
    // If in production and tables exist, skip initialization
    if (process.env.NODE_ENV === 'production' && tablesExist) {
      console.log('Database tables already exist. Skipping schema initialization in production.');
      return true;
    }
    
    // Force dropping all tables in correct order to avoid reference issues
    console.log('Dropping existing tables...');
    await pool.query(`
      DROP TABLE IF EXISTS delivery_request_items CASCADE;
      DROP TABLE IF EXISTS delivery_requests CASCADE;
      DROP TABLE IF EXISTS deliveries CASCADE;
      DROP TABLE IF EXISTS users CASCADE;
      DROP TABLE IF EXISTS branches CASCADE;
    `);
    
    console.log('Existing tables dropped successfully');
    
    // Apply the full schema
    console.log('Reading schema file...');
    const schemaPath = path.join(__dirname, 'db-schema.sql');
    console.log(`Schema file path: ${schemaPath}`);
    
    if (!fs.existsSync(schemaPath)) {
      throw new Error(`Schema file not found at ${schemaPath}`);
    }
    
    const schemaSQL = fs.readFileSync(schemaPath, 'utf8');
    console.log('Applying schema...');
    
    // Apply schema statement by statement to better identify errors
    const statements = schemaSQL.split(';')
      .map(stmt => stmt.trim())
      .filter(stmt => stmt.length > 0);
      
    for (let i = 0; i < statements.length; i++) {
      const stmt = statements[i];
      try {
        await pool.query(stmt + ';');
      } catch (stmtErr) {
        console.error(`Error executing statement ${i + 1}:`, stmtErr);
        console.error('Statement:', stmt);
        throw stmtErr;
      }
    }
    
    console.log('Database schema initialized successfully');
    return true;
  } catch (err) {
    console.error('Error initializing schema:', err);
    return false;
  }
};

module.exports = {
  query: (text, params) => pool.query(text, params),
  initializeSchema,
}; 