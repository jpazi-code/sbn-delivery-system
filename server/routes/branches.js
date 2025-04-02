const express = require('express');
const db = require('../db');
const { authenticateToken } = require('../middleware/auth');
const router = express.Router();

// Apply authentication middleware to all branch routes
router.use(authenticateToken);

// Get all branches
router.get('/', async (req, res) => {
  try {
    const result = await db.query('SELECT * FROM branches ORDER BY name');
    res.status(200).json(result.rows);
  } catch (error) {
    console.error('Get branches error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Get branch by id
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    const result = await db.query('SELECT * FROM branches WHERE id = $1', [id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Branch not found' });
    }
    
    res.status(200).json(result.rows[0]);
  } catch (error) {
    console.error('Get branch error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router; 