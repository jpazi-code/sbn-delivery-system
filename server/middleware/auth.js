const jwt = require('jsonwebtoken');
require('dotenv').config();

// Middleware to verify JWT token
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN format
  
  if (!token) {
    return res.status(401).json({ error: 'Access denied. No token provided.' });
  }

  try {
    const verified = jwt.verify(token, process.env.JWT_SECRET);
    req.user = {
      id: verified.id,
      username: verified.username,
      role: verified.role,
      branch_id: verified.branch_id
    };
    next();
  } catch (error) {
    return res.status(403).json({ error: 'Invalid token.' });
  }
};

// Middleware to check admin role
const isAdmin = (req, res, next) => {
  if (req.user && req.user.role === 'admin') {
    next();
  } else {
    return res.status(403).json({ error: 'Access denied. Admin privileges required.' });
  }
};

module.exports = {
  authenticateToken,
  isAdmin
}; 