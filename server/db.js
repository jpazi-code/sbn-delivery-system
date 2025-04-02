const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

// Global singleton pattern to reuse connection across serverless invocations
let globalPool;

// Create a connection pool to the database
const getPool = () => {
  if (globalPool) {
    return globalPool;
  }

  // Create new pool if one doesn't exist
  globalPool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: {
      rejectUnauthorized: false // Required for Neon connections
    },
    max: 3, // Reduced for serverless environment
    idleTimeoutMillis: 10000, // 10 seconds idle timeout - shorter for serverless
    connectionTimeoutMillis: 5000, // 5 seconds connection timeout - faster timeout for serverless
    keepAlive: true, // Enable TCP keepalive
    keepAliveInitialDelayMillis: 10000, // 10 seconds initial delay for keepalive
    allowExitOnIdle: true // Allow the pool to exit if there are no connections
  });

  // Add event listeners for connection issues
  globalPool.on('error', (err, client) => {
    console.error('Unexpected error on idle client', err);
    // Reset the pool on critical errors
    if (err.code === 'PROTOCOL_CONNECTION_LOST' || err.code === 'ECONNRESET' || err.code === 'ETIMEDOUT') {
      console.log('Lost connection to the database. Connection will be re-established on next request');
      globalPool = null; // Force new pool on next request
    }
  });

  return globalPool;
};

// Test the database connection - only run in development
if (process.env.NODE_ENV !== 'production') {
  getPool().connect()
    .then(client => {
      console.log('Connected to PostgreSQL database');
      client.release();
    })
    .catch(err => console.error('Database connection error:', err.stack));
}

// Add a function to check if database is already initialized
const checkDatabaseInitialized = async () => {
  const pool = getPool();
  try {
    const result = await pool.query(
      "SELECT EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'users')"
    );
    return result.rows[0].exists;
  } catch (err) {
    console.error('Error checking database initialization:', err);
    return false;
  }
};

// Modify initializeSchema to check first
const initializeSchema = async () => {
  // Skip schema initialization in production environment
  if (process.env.NODE_ENV === 'production' || process.env.VERCEL_ENV) {
    console.log('Skipping schema initialization in production environment');
    return true;
  }

  console.log('Starting database schema initialization...');
  
  // Check if database is already initialized
  const isInitialized = await checkDatabaseInitialized();
  if (isInitialized) {
    console.log('Database already initialized, skipping schema creation');
    return true;
  }

  const pool = getPool();
  try {
    // Only drop tables in development environment
    if (process.env.NODE_ENV === 'development') {
      console.log('Dropping existing tables...');
      await pool.query(`
        DROP TABLE IF EXISTS delivery_request_items CASCADE;
        DROP TABLE IF EXISTS delivery_requests CASCADE;
        DROP TABLE IF EXISTS deliveries CASCADE;
        DROP TABLE IF EXISTS users CASCADE;
        DROP TABLE IF EXISTS branches CASCADE;
      `);
      
      console.log('Existing tables dropped successfully');
    }
    
    // Only attempt to read schema file if not in Vercel environment
    if (process.env.VERCEL_ENV) {
      console.log('Skipping schema file application in Vercel environment');
      return true;
    }
    
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

// Simple query method with connection management
const query = async (text, params) => {
  const pool = getPool();
  let client;
  
  try {
    client = await pool.connect();
  } catch (connectionError) {
    console.error('Failed to connect to database:', connectionError);
    // Reset the pool on connection errors to try with a fresh pool next time
    globalPool = null;
    throw connectionError;
  }
  
  try {
    const result = await client.query(text, params);
    return result;
  } finally {
    client.release();
  }
};

module.exports = {
  query,
  initializeSchema,
}; 