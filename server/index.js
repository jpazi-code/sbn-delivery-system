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
const adminRoutes = require('./routes/admin');
const { authenticateToken } = require('./middleware/auth');

// Initialize express app
const app = express();
const PORT = process.env.PORT || 5000;

// CORS middleware
app.use(cors({
  origin: ['https://sbn-delivery-system-frontend.vercel.app', 'https://sbn-delivery-system-lxvdr7jk-jpazi-codes-projects.vercel.app'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-CSRF-Token', 'X-Requested-With', 'Accept', 'Accept-Version', 'Content-Length', 'Content-MD5', 'Date', 'X-Api-Version'],
  maxAge: 86400 // Cache preflight requests for 24 hours
}));

// For preflight requests
app.options('*', (req, res) => {
  res.header('Access-Control-Allow-Origin', req.headers.origin || '*');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With, X-API-Key');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Credentials', 'true');
  res.status(200).end();
});

app.use(express.json());

// Route middleware
app.use('/api/auth', authRoutes);
app.use('/api/users', usersRoutes);
app.use('/api/deliveries', deliveryRoutes);
app.use('/api/delivery-requests', deliveryRequestsRoutes);
app.use('/api/branches', branchesRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/admin', adminRoutes);

// Add compatibility layer for old /api/requests endpoint
app.use('/api/requests', (req, res) => {
  // Rewrite the URL path to point to delivery-requests
  req.url = req.url.replace('/api/requests', '/api/delivery-requests');
  
  // Forward to the correct handler
  deliveryRequestsRoutes(req, res);
});

// Specific handler for the items path that's causing 404 errors
// This ensures backward compatibility with client code using the old endpoint pattern
app.get('/api/requests/:id/items', async (req, res) => {
  try {
    const requestId = req.params.id;
    // Query the database directly to get items
    const itemsResult = await db.query(`
      SELECT * FROM delivery_request_items 
      WHERE request_id = $1
      ORDER BY id
    `, [requestId]);
    
    res.status(200).json(itemsResult.rows);
  } catch (error) {
    console.error(`Error fetching items for request ${req.params.id}:`, error);
    res.status(500).json({ error: 'Server error fetching items' });
  }
});

// Basic route
app.get('/api/health', (req, res) => {
  res.status(200).json({ status: 'ok', message: 'Server is running' });
});

// CORS test endpoint
app.get('/api/cors-test', (req, res) => {
  res.status(200).json({
    status: 'ok',
    message: 'CORS is working',
    headers: {
      origin: req.headers.origin,
      referer: req.headers.referer,
      host: req.headers.host,
      'user-agent': req.headers['user-agent']
    },
    timestamp: new Date().toISOString(),
    env: {
      NODE_ENV: process.env.NODE_ENV,
      VERCEL_ENV: process.env.VERCEL_ENV || 'not set'
    }
  });
});

// Add a /auth/test endpoint that doesn't need authentication
app.get('/api/auth/test', (req, res) => {
  res.status(200).json({
    status: 'ok',
    message: 'Auth route is accessible',
    cors: {
      origin: req.headers.origin,
      method: req.method
    }
  });
});

// Add a root route handler to prevent 404 on root path
app.get('/', (req, res) => {
  res.status(200).json({ 
    status: 'ok', 
    message: 'SBN Delivery System API is running',
    endpoints: [
      '/api/auth',
      '/api/users',
      '/api/deliveries',
      '/api/delivery-requests',
      '/api/branches',
      '/api/analytics',
      '/api/health'
    ]
  });
});

// Protected route example
app.get('/api/protected', authenticateToken, (req, res) => {
  res.status(200).json({ message: 'This is a protected route', user: req.user });
});

// Initialize database schema if not in production environment
if (process.env.NODE_ENV !== 'production' && !process.env.VERCEL_ENV) {
  db.initializeSchema()
    .then(() => {
      // Start server only after schema is initialized (for local development)
      app.listen(PORT, () => {
        console.log(`Server running on port ${PORT}`);
      });
    })
    .catch(err => {
      console.error('Failed to initialize database:', err);
      process.exit(1); // Exit if schema initialization fails
    });
} else {
  // For Vercel environment, just do a lightweight connection test
  db.query('SELECT NOW()')
    .then(() => {
      console.log('Database connection successful in production');
      
      // Only start the server if not in Vercel serverless environment
      if (!process.env.VERCEL_ENV) {
        app.listen(PORT, () => {
          console.log(`Server running on port ${PORT}`);
        });
      }
    })
    .catch(err => {
      console.error('Database connection failed:', err);
    });
}

// Export the Express app for Vercel
module.exports = app; 