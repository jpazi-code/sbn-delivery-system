const express = require('express');
const db = require('../db');
const { authenticateToken, isAdmin } = require('../middleware/auth');
const router = express.Router();

// Apply authentication middleware to all admin routes
router.use(authenticateToken);
router.use(isAdmin); // Ensure only admins can access these routes

// Clear archive endpoint
router.delete('/clear-archive', async (req, res) => {
  try {
    // Start a transaction to ensure all operations are atomic
    await db.query('BEGIN');
    
    // Delete archived delivery requests
    const archivedRequestsResult = await db.query(`
      DELETE FROM delivery_requests
      WHERE request_status = 'archived'
      RETURNING id
    `);
    
    // Delete archived deliveries
    const archivedDeliveriesResult = await db.query(`
      DELETE FROM deliveries
      WHERE status = 'archived'
      RETURNING id
    `);

    // Count the number of deleted records
    const deletedRequests = archivedRequestsResult.rows.length;
    const deletedDeliveries = archivedDeliveriesResult.rows.length;
    
    // Commit the transaction
    await db.query('COMMIT');
    
    // Send response with the count of deleted items
    res.status(200).json({
      success: true,
      message: 'Archive cleared successfully',
      deletedItems: {
        deliveryRequests: deletedRequests,
        deliveries: deletedDeliveries,
        total: deletedRequests + deletedDeliveries
      }
    });
  } catch (error) {
    // Rollback the transaction in case of error
    await db.query('ROLLBACK');
    
    console.error('Clear archive error:', error);
    res.status(500).json({ error: 'Failed to clear archive' });
  }
});

module.exports = router; 