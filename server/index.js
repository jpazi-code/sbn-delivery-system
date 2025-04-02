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

// Initialize database and start server
db.initializeSchema()
  .then(() => {
    // Start server only after schema is initialized
    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  })
  .catch(err => {
    console.error('Failed to initialize database:', err);
    process.exit(1); // Exit if schema initialization fails
  }); 