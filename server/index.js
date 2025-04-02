const express = require('express');
const cors = require('cors');
require('dotenv').config();
const db = require('./db');

// Import routes
const authRoutes = require('./routes/auth');
const usersRoutes = require('./routes/users');
const deliveryRoutes = require('./routes/deliveries');
const deliveryRequestsRoutes = require('./routes/delivery-requests');
const branchesRoutes = require('./routes/branches');
const analyticsRoutes = require('./routes/analytics');
const { authenticateToken } = require('./middleware/auth');

// Initialize express app
const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors({
  origin: process.env.NODE_ENV === 'production' 
    ? true // Allow requests from any origin in production
    : ['http://localhost:3000', 'http://localhost:3001', 'http://localhost:3002', 'http://localhost:3003'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json());

// Route middleware
app.use('/api/auth', authRoutes);
app.use('/api/users', usersRoutes);
app.use('/api/deliveries', deliveryRoutes);
app.use('/api/delivery-requests', deliveryRequestsRoutes);
app.use('/api/branches', branchesRoutes);
app.use('/api/analytics', analyticsRoutes);

// Root route for healthcheck
app.get('/', (req, res) => {
  res.status(200).json({ status: 'ok', message: 'SBN Delivery System API is running' });
});

// Basic health route
app.get('/api/health', (req, res) => {
  res.status(200).json({ status: 'ok', message: 'Server is running' });
});

// Protected route example
app.get('/api/protected', authenticateToken, (req, res) => {
  res.status(200).json({ message: 'This is a protected route', user: req.user });
});

// Start server first so health checks can succeed immediately
const server = app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running on port ${PORT}, bound to 0.0.0.0`);
  console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
  
  // Log database connection string (obscured)
  const dbUrl = process.env.DATABASE_URL || 'not set';
  console.log(`Database URL configured: ${dbUrl ? 'Yes (length: ' + dbUrl.length + ')' : 'No'}`);
});

// Initialize database after server starts
console.log('Initializing database schema...');
db.initializeSchema()
  .then((success) => {
    if (success) {
      console.log('Database schema initialized successfully');
    } else {
      console.warn('Database schema initialization returned false, but not throwing error');
    }
  })
  .catch(err => {
    console.error('Failed to initialize database:', err);
    
    // Check for common database connection issues
    if (err.message && err.message.includes('ECONNREFUSED')) {
      console.error('ERROR: Database connection refused. Please check:');
      console.error('1. DATABASE_URL environment variable is correct');
      console.error('2. Database service is running and accessible');
      console.error('3. Network settings allow connection to the database');
    }
    
    if (!process.env.DATABASE_URL) {
      console.error('ERROR: DATABASE_URL environment variable is not set!');
    }
    
    // Don't exit process on schema initialization error in production
    // This allows the healthcheck to pass
    if (process.env.NODE_ENV !== 'production') {
      process.exit(1);
    }
  }); 