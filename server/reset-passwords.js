const fs = require('fs');
const path = require('path');
const db = require('./db');
require('dotenv').config();

async function resetPasswords() {
  try {
    console.log('Starting password reset process...');
    
    // Read the SQL file
    const sqlPath = path.join(__dirname, 'reset-passwords.sql');
    const sql = fs.readFileSync(sqlPath, 'utf8');
    
    // Split the SQL into statements
    const statements = sql
      .split(';')
      .map(stmt => stmt.trim())
      .filter(stmt => stmt.length > 0);
    
    // Execute each statement
    for (let i = 0; i < statements.length; i++) {
      const result = await db.query(statements[i] + ';');
      
      // If this is the SELECT statement, show the results
      if (statements[i].toLowerCase().includes('select')) {
        console.log('Updated users:');
        console.table(result.rows);
      } else {
        console.log(`Statement ${i + 1} executed: ${result.rowCount} rows affected`);
      }
    }
    
    console.log('Password reset completed successfully');
  } catch (error) {
    console.error('Error resetting passwords:', error);
  } finally {
    process.exit();
  }
}

resetPasswords(); 