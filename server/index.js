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

// CORS middleware
app.use(cors({
  origin: '*', // Allow all origins
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Handle OPTIONS preflight requests
app.options('*', cors());

app.use(express.json());

// Route middleware
app.use('/api/auth', authRoutes);
app.use('/api/users', usersRoutes);
app.use('/api/deliveries', deliveryRoutes);
app.use('/api/delivery-requests', deliveryRequestsRoutes);
app.use('/api/branches', branchesRoutes);
app.use('/api/analytics', analyticsRoutes);

// Basic route
app.get('/api/health', (req, res) => {
  res.status(200).json({ status: 'ok', message: 'Server is running' });
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