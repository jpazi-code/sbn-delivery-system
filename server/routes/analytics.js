const express = require('express');
const router = express.Router();
const db = require('../db');
const { authenticateToken } = require('../middleware/auth');

// Admin: Get branch performance metrics
router.get('/branch-performance', authenticateToken, async (req, res) => {
  try {
    // Check if user is admin
    if (req.user.role !== 'admin' && req.user.role !== 'warehouse') {
      return res.status(403).json({ error: 'Unauthorized access' });
    }
    
    const { timeframe, branch_id } = req.query;
    let timeCondition = '';
    
    // Set time filter condition
    if (timeframe === 'month') {
      timeCondition = "AND d.created_at >= NOW() - INTERVAL '1 month'";
    } else if (timeframe === '3months') {
      timeCondition = "AND d.created_at >= NOW() - INTERVAL '3 months'";
    } else if (timeframe === 'year') {
      timeCondition = "AND d.created_at >= NOW() - INTERVAL '1 year'";
    }
    
    // Add branch filter if specified
    let branchCondition = '';
    if (branch_id) {
      branchCondition = `AND d.branch_id = ${parseInt(branch_id, 10)}`;
    }
    
    // Get delivery performance metrics
    const deliveryMetrics = await db.query(`
      SELECT 
        b.id as branch_id,
        b.name as branch_name,
        COUNT(d.id) as total_deliveries,
        AVG(EXTRACT(EPOCH FROM (d.updated_at - d.created_at)) / 3600)::numeric(10,2) as avg_delivery_time_hours,
        COUNT(CASE WHEN d.status = 'delivered' THEN 1 END) as completed_deliveries,
        COUNT(CASE WHEN d.status = 'in_transit' THEN 1 END) as in_transit_deliveries,
        COUNT(CASE WHEN d.status = 'cancelled' THEN 1 END) as cancelled_deliveries,
        SUM(CASE WHEN dr.total_amount IS NOT NULL THEN dr.total_amount ELSE 0 END)::numeric(10,2) as total_amount
      FROM 
        deliveries d
      LEFT JOIN 
        branches b ON d.branch_id = b.id
      LEFT JOIN
        delivery_requests dr ON d.request_id = dr.id
      WHERE 
        1=1 
        ${timeCondition}
        ${branchCondition}
      GROUP BY 
        b.id, b.name
      ORDER BY 
        total_deliveries DESC
    `);
    
    // Get average request-to-delivery time
    const processingTimeMetrics = await db.query(`
      SELECT 
        b.id as branch_id,
        b.name as branch_name,
        AVG(EXTRACT(EPOCH FROM (d.created_at - dr.created_at)) / 3600)::numeric(10,2) as avg_request_to_delivery_hours
      FROM 
        deliveries d
      JOIN 
        delivery_requests dr ON d.request_id = dr.id
      JOIN 
        branches b ON dr.branch_id = b.id
      WHERE 
        d.request_id IS NOT NULL
        ${timeCondition}
        ${branchCondition}
      GROUP BY 
        b.id, b.name
    `);
    
    // Combine results
    const results = deliveryMetrics.rows.map(branch => {
      const processingTime = processingTimeMetrics.rows.find(b => b.branch_id === branch.branch_id);
      return {
        ...branch,
        avg_request_to_delivery_hours: processingTime ? processingTime.avg_request_to_delivery_hours : null
      };
    });
    
    res.json(results);
  } catch (error) {
    console.error('Branch performance error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Branch: Get branch summary
router.get('/branch-summary/:id?', authenticateToken, async (req, res) => {
  try {
    let branchId = req.params.id;
    
    // If no branch ID is provided, use the user's branch
    if (!branchId && req.user.branch_id) {
      branchId = req.user.branch_id;
    }
    
    // Ensure branch ID is valid
    if (!branchId) {
      return res.status(400).json({ error: 'Branch ID is required' });
    }
    
    const { timeframe } = req.query;
    let deliveriesTimeCondition = '';
    let requestsTimeCondition = '';
    
    // Set time filter condition with table aliases
    if (timeframe === 'month') {
      deliveriesTimeCondition = "AND d.created_at >= NOW() - INTERVAL '1 month'";
      requestsTimeCondition = "AND r.created_at >= NOW() - INTERVAL '1 month'";
    } else if (timeframe === '3months') {
      deliveriesTimeCondition = "AND d.created_at >= NOW() - INTERVAL '3 months'";
      requestsTimeCondition = "AND r.created_at >= NOW() - INTERVAL '3 months'";
    } else if (timeframe === 'year') {
      deliveriesTimeCondition = "AND d.created_at >= NOW() - INTERVAL '1 year'";
      requestsTimeCondition = "AND r.created_at >= NOW() - INTERVAL '1 year'";
    }
    
    // Get summary data
    const summary = await db.query(`
      SELECT
        (SELECT COUNT(*) FROM deliveries d WHERE d.branch_id = $1 AND d.status = 'delivered' ${deliveriesTimeCondition}) as completed_deliveries,
        (SELECT COUNT(*) FROM deliveries d WHERE d.branch_id = $1 AND d.status IN ('pending', 'preparing', 'loading', 'in_transit') ${deliveriesTimeCondition}) as ongoing_deliveries,
        (SELECT COUNT(*) FROM delivery_requests r WHERE r.branch_id = $1 AND r.request_status IN ('pending', 'approved') ${requestsTimeCondition}) as ongoing_requests,
        (SELECT SUM(r.total_amount) FROM delivery_requests r WHERE r.branch_id = $1 AND r.request_status != 'rejected' ${requestsTimeCondition})::numeric(10,2) as total_imported
    `, [branchId]);
    
    // Get branch details
    const branchDetails = await db.query('SELECT * FROM branches WHERE id = $1', [branchId]);
    
    // Get recent completed deliveries
    const completedDeliveries = await db.query(`
      SELECT d.*, b.name as branch_name
      FROM deliveries d
      LEFT JOIN branches b ON d.branch_id = b.id
      WHERE d.branch_id = $1 AND d.status = 'delivered' ${deliveriesTimeCondition}
      ORDER BY d.updated_at DESC
      LIMIT 5
    `, [branchId]);
    
    // Get recent requests
    const recentRequests = await db.query(`
      SELECT r.*, b.name as branch_name
      FROM delivery_requests r
      LEFT JOIN branches b ON r.branch_id = b.id
      WHERE r.branch_id = $1 ${requestsTimeCondition}
      ORDER BY r.created_at DESC
      LIMIT 5
    `, [branchId]);
    
    res.json({
      summary: summary.rows[0],
      branch: branchDetails.rows[0],
      recent_deliveries: completedDeliveries.rows,
      recent_requests: recentRequests.rows
    });
  } catch (error) {
    console.error('Branch summary error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Warehouse: Get warehouse analytics
router.get('/warehouse', authenticateToken, async (req, res) => {
  try {
    // Check if user is warehouse or admin
    if (req.user.role !== 'warehouse' && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Unauthorized access' });
    }
    
    const { timeframe } = req.query;
    let timeCondition = '';
    
    // Set time filter condition
    if (timeframe === 'month') {
      timeCondition = "AND r.created_at >= NOW() - INTERVAL '1 month'";
    } else if (timeframe === '3months') {
      timeCondition = "AND r.created_at >= NOW() - INTERVAL '3 months'";
    } else if (timeframe === 'year') {
      timeCondition = "AND r.created_at >= NOW() - INTERVAL '1 year'";
    }
    
    // Get branch with most requests
    const mostRequests = await db.query(`
      SELECT 
        b.id, 
        b.name, 
        COUNT(r.id) as request_count
      FROM 
        branches b
      LEFT JOIN 
        delivery_requests r ON b.id = r.branch_id
      WHERE 
        1=1 ${timeCondition}
      GROUP BY 
        b.id, b.name
      ORDER BY 
        request_count DESC
      LIMIT 1
    `);
    
    // Get branch with most expensive requests
    const mostExpensive = await db.query(`
      SELECT 
        b.id, 
        b.name, 
        SUM(r.total_amount)::numeric(10,2) as total_value
      FROM 
        branches b
      LEFT JOIN 
        delivery_requests r ON b.id = r.branch_id
      WHERE 
        1=1 ${timeCondition}
      GROUP BY 
        b.id, b.name
      ORDER BY 
        total_value DESC
      LIMIT 1
    `);
    
    // Get total amount exported (sum of all delivery requests)
    const totalExported = await db.query(`
      SELECT 
        SUM(r.total_amount)::numeric(10,2) as total_exported
      FROM 
        delivery_requests r
      WHERE 
        r.request_status != 'rejected' ${timeCondition}
    `);
    
    // Get monthly totals for chart
    const monthlyTotals = await db.query(`
      SELECT 
        TO_CHAR(DATE_TRUNC('month', r.created_at), 'YYYY-MM') as month,
        SUM(r.total_amount)::numeric(10,2) as monthly_amount
      FROM 
        delivery_requests r
      WHERE 
        r.request_status != 'rejected' ${timeCondition}
      GROUP BY 
        DATE_TRUNC('month', r.created_at)
      ORDER BY 
        DATE_TRUNC('month', r.created_at)
    `);
    
    // Get average delivery time for completed deliveries
    const avgDeliveryTime = await db.query(`
      SELECT 
        AVG(EXTRACT(EPOCH FROM (d.updated_at - d.created_at)) / 3600)::numeric(10,2) as avg_delivery_time_hours
      FROM 
        deliveries d
      WHERE 
        d.status = 'delivered'
        AND d.created_at >= NOW() - INTERVAL '${timeframe === 'month' ? '1 month' : timeframe === '3months' ? '3 months' : '1 year'}'
    `);
    
    res.json({
      most_requests: mostRequests.rows[0],
      most_expensive: mostExpensive.rows[0],
      total_exported: totalExported.rows[0],
      monthly_totals: monthlyTotals.rows,
      avg_delivery_time: avgDeliveryTime.rows[0]
    });
  } catch (error) {
    console.error('Warehouse analytics error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router; 