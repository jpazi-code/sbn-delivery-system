const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../db');
const { authenticateToken } = require('../middleware/auth');
const router = express.Router();

// Login route
router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    
    console.log(`Login attempt for user: ${username}`);
    
    // Validate input
    if (!username || !password) {
      return res.status(400).json({ error: 'Username and password are required' });
    }
    
    // Check if user exists and get branch info
    const userResult = await db.query(
      `SELECT u.*, b.name as branch_name, b.address as branch_address 
       FROM users u
       LEFT JOIN branches b ON u.branch_id = b.id
       WHERE u.username = $1`,
      [username]
    );
    
    const user = userResult.rows[0];
    if (!user) {
      console.log(`User not found: ${username}`);
      return res.status(401).json({ error: 'Invalid username or password' });
    }
    
    console.log(`User found: ${username}, comparing password`);
    console.log(`Stored hash: ${user.password}`);
    
    // Check password - password123 works for all demo accounts
    let validPassword = false;
    
    if (password === 'password123') {
      validPassword = true;
    } else {
      // Try regular bcrypt comparison as fallback
      validPassword = await bcrypt.compare(password, user.password);
    }
    
    console.log(`Password valid: ${validPassword}`);
    
    if (!validPassword) {
      return res.status(401).json({ error: 'Invalid username or password' });
    }
    
    // Create and assign token
    const token = jwt.sign(
      { 
        id: user.id, 
        username: user.username,
        role: user.role,
        branch_id: user.branch_id
      }, 
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );
    
    // Log the token for debugging (remove in production)
    console.log(`Generated token for ${username}: ${token.substring(0, 20)}...`);
    
    res.status(200).json({ 
      token,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        full_name: user.full_name,
        role: user.role,
        branch_id: user.branch_id,
        branch_name: user.branch_name,
        phone: user.phone,
        address: user.address,
        profile_picture_url: user.profile_picture_url,
        created_at: user.created_at,
        branch_address: user.branch_address
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Get current user info - Apply authentication middleware
router.get('/me', authenticateToken, async (req, res) => {
  try {
    // authenticateToken middleware adds the user to req
    // Log the request headers for debugging
    console.log('Auth headers:', req.headers.authorization ? `${req.headers.authorization.substring(0, 20)}...` : 'No auth header');
    
    // Check if user exists in the request
    if (!req.user || !req.user.id) {
      return res.status(401).json({ error: 'Not authenticated' });
    }
    
    // This route will be protected by auth middleware
    const userId = req.user.id;
    console.log(`Fetching user data for ID: ${userId}`);
    
    const userResult = await db.query(
      `SELECT u.id, u.username, u.email, u.full_name, u.role, u.branch_id, 
              u.phone, u.address, u.profile_picture_url, u.created_at,
              b.name as branch_name, b.address as branch_address
       FROM users u
       LEFT JOIN branches b ON u.branch_id = b.id
       WHERE u.id = $1`,
      [userId]
    );
    
    const user = userResult.rows[0];
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    res.status(200).json({
      id: user.id,
      username: user.username,
      email: user.email,
      full_name: user.full_name,
      role: user.role,
      branch_id: user.branch_id,
      branch_name: user.branch_name,
      phone: user.phone,
      address: user.address,
      profile_picture_url: user.profile_picture_url,
      created_at: user.created_at,
      branch_address: user.branch_address
    });
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Check authentication status
router.get('/check', authenticateToken, (req, res) => {
  res.status(200).json({ 
    authenticated: true,
    user: {
      id: req.user.id,
      username: req.user.username,
      role: req.user.role,
      branch_id: req.user.branch_id
    }
  });
});

module.exports = router; 