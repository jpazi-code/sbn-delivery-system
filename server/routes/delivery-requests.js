const express = require('express');
const db = require('../db');
const { authenticateToken } = require('../middleware/auth');
const router = express.Router();

// Apply authentication middleware to all routes
router.use(authenticateToken);

// Get all delivery requests
// Admin and warehouse users can see all requests
// Branch users can only see their own requests
router.get('/', async (req, res) => {
  try {
    const { role, id, branch_id } = req.user;
    
    // Build the base query
    let query = `
      SELECT 
        dr.*,
        b.name as branch_name,
        creator.full_name as requested_by,
        creator.username
      FROM delivery_requests dr
      JOIN branches b ON dr.branch_id = b.id
      LEFT JOIN users creator ON creator.id = dr.created_by_id
      WHERE 1=1
    `;
    
    const queryParams = [];
    let paramIndex = 1;

    // Apply role-based restrictions
    if (role === 'branch') {
      // Branch users can only see their own requests
      query += ` AND dr.branch_id = $${paramIndex}`;
      queryParams.push(branch_id);
      paramIndex++;
    } else if (role !== 'admin' && role !== 'warehouse') {
      return res.status(403).json({ error: 'Unauthorized role for this operation' });
    }
    
    // Filter by branch_id if specified in the query (for admin/warehouse)
    if ((role === 'admin' || role === 'warehouse') && req.query.branch_id && req.query.branch_id !== 'all') {
      query += ` AND dr.branch_id = $${paramIndex}`;
      queryParams.push(req.query.branch_id);
      paramIndex++;
    }
    
    // Filter for ongoing requests if requested
    if (req.query.ongoing === 'true') {
      query += ` AND dr.request_status IN ('pending', 'approved', 'processing')`;
    }
    
    // Filter for non-archived requests by default, unless explicitly requesting archived
    if (req.query.archived !== 'true' && req.query.is_archived !== 'true') {
      query += ` AND (dr.is_archived = FALSE OR dr.is_archived IS NULL)`;
    }
    
    // Order by newest first
    query += ` ORDER BY dr.created_at DESC`;

    const result = await db.query(query, queryParams);

    // Add items for each delivery request
    const requests = result.rows;
    for (const request of requests) {
      const itemsResult = await db.query(`
        SELECT * FROM delivery_request_items 
        WHERE request_id = $1
        ORDER BY id
      `, [request.id]);
      
      request.items = itemsResult.rows;
    }

    res.status(200).json(requests);
  } catch (error) {
    console.error('Get delivery requests error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Get archived delivery requests
router.get('/archive', async (req, res) => {
  try {
    console.log('Archive delivery requests API called with query:', req.query);
    const { role, id, branch_id } = req.user;
    
    // Check role-based access
    if (role !== 'admin' && role !== 'warehouse' && role !== 'branch') {
      return res.status(403).json({ error: 'Unauthorized access' });
    }

    let query = `
      SELECT 
        dr.*,
        b.name as branch_name,
        creator.full_name as requested_by,
        creator.username
      FROM delivery_requests dr
      JOIN branches b ON dr.branch_id = b.id
      LEFT JOIN users creator ON creator.id = dr.created_by_id
      WHERE (dr.request_status = 'delivered' OR dr.request_status = 'cancelled' 
             OR dr.request_status = 'rejected' OR dr.is_archived = true)
    `;
    
    const queryParams = [];
    let paramCount = 1;

    // Branch users can only see their branch's archive
    if (role === 'branch') {
      query += ` AND dr.branch_id = $${paramCount}`;
      queryParams.push(branch_id);
      paramCount++;
    } 
    // Admin/warehouse users can filter by branch if specified
    else if ((role === 'admin' || role === 'warehouse') && req.query.branch_id && req.query.branch_id !== 'all') {
      query += ` AND dr.branch_id = $${paramCount}`;
      queryParams.push(req.query.branch_id);
      paramCount++;
    }

    // Date filtering
    if (req.query.date_range) {
      let dateCondition;
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      switch(req.query.date_range) {
        case 'today':
          dateCondition = `DATE(dr.created_at) = CURRENT_DATE`;
          break;
        case 'last_7_days':
          dateCondition = `dr.created_at >= CURRENT_DATE - INTERVAL '7 days'`;
          break;
        case 'last_30_days':
          dateCondition = `dr.created_at >= CURRENT_DATE - INTERVAL '30 days'`;
          break;
        case 'last_90_days':
          dateCondition = `dr.created_at >= CURRENT_DATE - INTERVAL '90 days'`;
          break;
        default:
          dateCondition = null;
      }

      if (dateCondition) {
        query += ` AND ${dateCondition}`;
      }
    } 
    // Custom date range
    else if (req.query.start_date && req.query.end_date) {
      query += ` AND DATE(dr.created_at) BETWEEN $${paramCount} AND $${paramCount + 1}`;
      queryParams.push(req.query.start_date);
      paramCount++;
      queryParams.push(req.query.end_date);
      paramCount++;
    }

    // Order by newest first
    query += ` ORDER BY dr.created_at DESC`;

    console.log('Executing SQL query:', query);
    console.log('With parameters:', queryParams);
    
    const result = await db.query(query, queryParams);
    console.log(`Found ${result.rows.length} archived requests`);
    
    // Add items for each delivery request
    const requests = result.rows;
    for (const request of requests) {
      const itemsResult = await db.query(`
        SELECT * FROM delivery_request_items 
        WHERE request_id = $1
        ORDER BY id
      `, [request.id]);
      
      request.items = itemsResult.rows;
    }

    res.status(200).json(requests);
  } catch (error) {
    console.error('Get archived delivery requests error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Get delivery request by id
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { role, branch_id } = req.user;

    console.log(`Getting delivery request details for ID: ${id}`);

    const result = await db.query(`
      SELECT 
        dr.*,
        b.name as branch_name,
        creator.full_name as requested_by,
        creator.username
      FROM delivery_requests dr
      JOIN branches b ON dr.branch_id = b.id
      LEFT JOIN users creator ON creator.id = dr.created_by_id
      WHERE dr.id = $1
      LIMIT 1
    `, [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Delivery request not found' });
    }

    // Check permissions
    const request = result.rows[0];
    if (role === 'branch' && request.branch_id !== branch_id) {
      return res.status(403).json({ error: 'Unauthorized to view this request' });
    }

    // Get items for this request
    const itemsResult = await db.query(`
      SELECT * FROM delivery_request_items 
      WHERE request_id = $1
      ORDER BY id
    `, [id]);
    
    request.items = itemsResult.rows;

    res.status(200).json(request);
  } catch (error) {
    console.error('Get delivery request error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Create new delivery request (branch users only)
router.post('/', async (req, res) => {
  try {
    const { role, id, branch_id } = req.user;
    
    // Only branch users can create requests
    if (role !== 'branch') {
      return res.status(403).json({ error: 'Only branch users can create delivery requests' });
    }
    
    const { 
      branch, 
      deliveryDate, 
      priority,
      notes,
      items,
      total_amount
    } = req.body;
    
    // Basic validation
    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ error: 'At least one item is required' });
    }
    
    // Use either selected branch or user's branch_id
    const requestBranchId = branch || branch_id;
    
    if (!requestBranchId) {
      return res.status(400).json({ error: 'Branch is required' });
    }
    
    // Validate each item
    for (const item of items) {
      if (!item.description || !item.quantity || !item.unit || !item.unit_price) {
        return res.status(400).json({ error: 'Each item must have description, quantity, unit, and unit price' });
      }
      
      if (item.quantity <= 0) {
        return res.status(400).json({ error: 'Item quantity must be greater than zero' });
      }
      
      if (item.unit_price < 0) {
        return res.status(400).json({ error: 'Item unit price cannot be negative' });
      }
    }

    console.log(`Creating delivery request by user ID: ${id}`);
    if (!id) {
      console.warn('Warning: User ID is not available in req.user');
    }
    
    // Start a transaction
    await db.query('BEGIN');
    
    try {
      // Always include created_by_id in the query, adding the column if it doesn't exist
      try {
        // First check if the column exists
        const columnCheckResult = await db.query(`
          SELECT column_name 
          FROM information_schema.columns 
          WHERE table_name = 'delivery_requests' 
          AND column_name = 'created_by_id'
        `);
        
        // If column doesn't exist, add it
        if (columnCheckResult.rows.length === 0) {
          console.log('Adding created_by_id column to delivery_requests table');
          await db.query(`
            ALTER TABLE delivery_requests 
            ADD COLUMN created_by_id INTEGER REFERENCES users(id)
          `);
        }
      } catch (columnError) {
        console.error('Error checking/adding created_by_id column:', columnError);
        // Continue even if column check fails - the insert will still work
      }
      
      // Create the delivery request with created_by_id
      const requestResult = await db.query(`
        INSERT INTO delivery_requests (
          branch_id,
          delivery_date,
          priority,
          notes,
          total_amount,
          created_by_id
        ) VALUES ($1, $2, $3, $4, $5, $6)
        RETURNING *
      `, [
        requestBranchId,
        deliveryDate || null,
        priority || 'medium',
        notes || null,
        total_amount || 0,
        id // Store the actual creator's ID
      ]);
      
      const request = requestResult.rows[0];
      console.log(`Created request #${request.id} with created_by_id: ${request.created_by_id || 'NULL'}`);
      
      // Insert all items
      for (const item of items) {
        await db.query(`
          INSERT INTO delivery_request_items (
            request_id,
            item_code,
            description,
            quantity,
            unit,
            unit_price,
            subtotal
          ) VALUES ($1, $2, $3, $4, $5, $6, $7)
        `, [
          request.id,
          item.item_code || null,
          item.description,
          item.quantity,
          item.unit,
          item.unit_price,
          item.subtotal || (item.quantity * item.unit_price)
        ]);
      }
      
      // Commit the transaction
      await db.query('COMMIT');
      
      // Get the full request with items
      const fullResult = await db.query(`
        SELECT 
          dr.*,
          b.name as branch_name,
          creator.full_name as requested_by,
          creator.username
        FROM delivery_requests dr
        JOIN branches b ON dr.branch_id = b.id
        LEFT JOIN users creator ON creator.id = dr.created_by_id
        WHERE dr.id = $1
      `, [request.id]);
      
      const fullRequest = fullResult.rows[0];
      
      // Ensure we always have a requester name
      if (!fullRequest.requested_by) {
        const userResult = await db.query('SELECT full_name, username FROM users WHERE id = $1', [id]);
        if (userResult.rows.length > 0) {
          fullRequest.requested_by = userResult.rows[0].full_name;
          fullRequest.username = userResult.rows[0].username;
          
          // Fix the database while we're at it - ensure the created_by_id is set
          await db.query('UPDATE delivery_requests SET created_by_id = $1 WHERE id = $2 AND created_by_id IS NULL', 
            [id, request.id]);
        }
      }
      
      // Get items for this request
      const itemsResult = await db.query(`
        SELECT * FROM delivery_request_items 
        WHERE request_id = $1
        ORDER BY id
      `, [request.id]);
      
      fullRequest.items = itemsResult.rows;
      
      res.status(201).json(fullRequest);
    } catch (error) {
      // Rollback the transaction on error
      await db.query('ROLLBACK');
      throw error;
    }
  } catch (error) {
    console.error('Create delivery request error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Update delivery request status (admin and warehouse users only)
router.put('/:id/status', async (req, res) => {
  try {
    const { id } = req.params;
    const { role, id: userId, username } = req.user;
    const { request_status, reason } = req.body;
    
    // Only admin and warehouse users can update request status
    if (role !== 'admin' && role !== 'warehouse') {
      return res.status(403).json({ error: 'Unauthorized to update request status' });
    }
    
    // Validate status
    if (!request_status || !['approved', 'rejected', 'pending', 'processing', 'delivered'].includes(request_status)) {
      return res.status(400).json({ error: 'Valid status (approved/rejected/pending/processing/delivered) is required' });
    }
    
    // If status is rejected, reason is required
    if (request_status === 'rejected' && !reason) {
      return res.status(400).json({ error: 'Reason is required when rejecting a request' });
    }
    
    // Check if request exists and get its current status
    const checkResult = await db.query('SELECT * FROM delivery_requests WHERE id = $1', [id]);
    
    if (checkResult.rows.length === 0) {
      return res.status(404).json({ error: 'Delivery request not found' });
    }
    
    const currentRequest = checkResult.rows[0];
    
    // Check if the request is already processed (approved/rejected/processing/delivered)
    if (currentRequest.request_status !== 'pending') {
      // Get the user who processed it
      const processorQuery = `
        SELECT u.username 
        FROM delivery_requests dr
        JOIN users u ON u.id = dr.processed_by
        WHERE dr.id = $1
      `;
      const processorResult = await db.query(processorQuery, [id]);
      const processorUsername = processorResult.rows.length > 0 ? processorResult.rows[0].username : 'another user';
      
      return res.status(409).json({ 
        error: `Oops, this request has already been ${currentRequest.request_status} by ${processorUsername}`,
        currentStatus: currentRequest.request_status,
        processorUsername
      });
    }
    
    // Update request status and store who processed it
    const result = await db.query(`
      UPDATE delivery_requests
      SET 
        request_status = $1, 
        reason = $2, 
        processed_by = $3,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = $4
      RETURNING *
    `, [
      request_status,
      reason || null,
      userId,
      id
    ]);

    // Get the full request with items
    const fullResult = await db.query(`
      SELECT dr.*, b.name as branch_name, 
             p.username as processor_username, p.full_name as processor_full_name,
             creator.full_name as requested_by,
             creator.username
      FROM delivery_requests dr
      JOIN branches b ON dr.branch_id = b.id
      LEFT JOIN users p ON dr.processed_by = p.id
      LEFT JOIN users creator ON creator.id = dr.created_by_id
      WHERE dr.id = $1
    `, [id]);
    
    const fullRequest = fullResult.rows[0];
    
    // Get items for this request
    const itemsResult = await db.query(`
      SELECT * FROM delivery_request_items 
      WHERE request_id = $1
      ORDER BY id
    `, [id]);
    
    fullRequest.items = itemsResult.rows;
    
    res.status(200).json(fullRequest);
  } catch (error) {
    console.error('Update delivery request status error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Delete delivery request
router.delete('/:id', async (req, res) => {
  try {
    const { role, branch_id } = req.user;
    const requestId = parseInt(req.params.id, 10);
    
    if (isNaN(requestId)) {
      return res.status(400).json({ error: 'Invalid request ID' });
    }
    
    // Check if request exists and belongs to user's branch (for branch users)
    const requestCheck = await db.query(`
      SELECT * FROM delivery_requests WHERE id = $1
    `, [requestId]);
    
    if (requestCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Delivery request not found' });
    }
    
    const request = requestCheck.rows[0];
    
    // Branch users can only delete their own branch's requests
    if (role === 'branch' && request.branch_id !== branch_id) {
      return res.status(403).json({ error: 'You can only delete requests from your own branch' });
    }
    
    // Archive the request instead of deleting it
    await db.query(`
      UPDATE delivery_requests
      SET is_archived = true,
          request_status = CASE 
            WHEN request_status NOT IN ('delivered', 'cancelled', 'rejected') 
            THEN 'cancelled' 
            ELSE request_status 
          END,
          updated_at = CURRENT_TIMESTAMP,
          archived_by = $1,
          archived_at = CURRENT_TIMESTAMP
      WHERE id = $2
    `, [req.user.id, requestId]);
    
    res.json({ message: 'Delivery request archived successfully' });
  } catch (error) {
    console.error('Archive delivery request error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Add these new routes to handle request processing status checks

// Check if a delivery request is being processed
router.get('/:id/processing-status', authenticateToken, async (req, res) => {
  try {
    const requestId = parseInt(req.params.id, 10);
    if (isNaN(requestId)) {
      return res.status(400).json({ message: 'Invalid request ID' });
    }

    // Check if request exists and is in appropriate status
    const requestCheck = await db.query(
      'SELECT id, request_status FROM delivery_requests WHERE id = $1',
      [requestId]
    );

    if (requestCheck.rows.length === 0) {
      return res.status(404).json({ message: 'Request not found' });
    }

    if (requestCheck.rows[0].request_status !== 'approved') {
      return res.status(400).json({ 
        message: 'Only approved requests can be processed for delivery'
      });
    }

    // Check if request is being processed
    const processingCheck = await db.query(
      `SELECT rp.*, u.username, u.full_name 
       FROM request_processing rp
       JOIN users u ON rp.user_id = u.id
       WHERE rp.request_id = $1`,
      [requestId]
    );

    const isBeingProcessed = processingCheck.rows.length > 0;
    const processingUser = isBeingProcessed ? processingCheck.rows[0] : null;
    const isCurrentUser = isBeingProcessed && processingUser.user_id === req.user.id;

    res.json({
      isBeingProcessed,
      isCurrentUser,
      processingUser: processingUser ? {
        id: processingUser.user_id,
        username: processingUser.username,
        fullName: processingUser.full_name
      } : null
    });
  } catch (error) {
    console.error('Error checking request processing status:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Mark a request as being processed by the current user
router.post('/:id/mark-processing', authenticateToken, async (req, res) => {
  try {
    const requestId = parseInt(req.params.id, 10);
    if (isNaN(requestId)) {
      return res.status(400).json({ message: 'Invalid request ID' });
    }

    // Check if request exists and is in appropriate status
    const requestCheck = await db.query(
      'SELECT id, request_status FROM delivery_requests WHERE id = $1',
      [requestId]
    );

    if (requestCheck.rows.length === 0) {
      return res.status(404).json({ message: 'Request not found' });
    }

    if (requestCheck.rows[0].request_status !== 'approved') {
      return res.status(400).json({ 
        message: 'Only approved requests can be processed for delivery'
      });
    }

    // Check if already being processed by someone else
    const processingCheck = await db.query(
      'SELECT * FROM request_processing WHERE request_id = $1 AND user_id != $2',
      [requestId, req.user.id]
    );

    if (processingCheck.rows.length > 0) {
      return res.status(409).json({ 
        message: 'Request is already being processed by another user',
        processingUserId: processingCheck.rows[0].user_id
      });
    }

    // Check if the current user is already processing this request
    const currentUserCheck = await db.query(
      'SELECT * FROM request_processing WHERE request_id = $1 AND user_id = $2',
      [requestId, req.user.id]
    );

    // If not, create a new processing record
    if (currentUserCheck.rows.length === 0) {
      await db.query(
        `INSERT INTO request_processing (request_id, user_id, started_at)
         VALUES ($1, $2, NOW())`,
        [requestId, req.user.id]
      );
    }

    res.json({ message: 'Request marked as being processed' });
  } catch (error) {
    console.error('Error marking request as processing:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Unmark a request as being processed by the current user
router.post('/:id/unmark-processing', authenticateToken, async (req, res) => {
  try {
    const requestId = parseInt(req.params.id, 10);
    if (isNaN(requestId)) {
      return res.status(400).json({ message: 'Invalid request ID' });
    }

    // Delete the processing record for this user
    await db.query(
      'DELETE FROM request_processing WHERE request_id = $1 AND user_id = $2',
      [requestId, req.user.id]
    );

    res.json({ message: 'Request unmarked as being processed' });
  } catch (error) {
    console.error('Error unmarking request as processing:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router; 