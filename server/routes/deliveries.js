const express = require('express');
const db = require('../db');
const { authenticateToken } = require('../middleware/auth');
const router = express.Router();

// Apply authentication middleware to all delivery routes
router.use(authenticateToken);

// Helper function to ensure timestamp formatting consistency for delivery routes
// This ensures consistent datetime handling for received_at timestamps 

// Get all deliveries
router.get('/', async (req, res) => {
  try {
    // Check if there's a branch_id in the query parameters
    const branchId = req.query.branch_id ? parseInt(req.query.branch_id, 10) : null;
    
    // Branch users can only see their own branch's deliveries
    if (req.user.role === 'branch') {
      const result = await db.query(`
        SELECT d.*, u.username as created_by_user, b.name as branch_name 
        FROM deliveries d
        LEFT JOIN users u ON d.created_by = u.id
        LEFT JOIN branches b ON d.branch_id = b.id
        WHERE d.branch_id = $1
        ORDER BY d.created_at DESC
      `, [req.user.branch_id]);
      
      return res.status(200).json(result.rows);
    }
    
    // Admin users can either see all deliveries or filter by branch_id
    if (branchId) {
      const result = await db.query(`
        SELECT d.*, u.username as created_by_user, b.name as branch_name 
        FROM deliveries d
        LEFT JOIN users u ON d.created_by = u.id
        LEFT JOIN branches b ON d.branch_id = b.id
        WHERE d.branch_id = $1
        ORDER BY d.created_at DESC
      `, [branchId]);
      
      return res.status(200).json(result.rows);
    }
    
    // No branch filter for admin - return all deliveries
    const result = await db.query(`
      SELECT d.*, u.username as created_by_user, b.name as branch_name
      FROM deliveries d
      LEFT JOIN users u ON d.created_by = u.id
      LEFT JOIN branches b ON d.branch_id = b.id
      ORDER BY d.created_at DESC
    `);
    
    res.status(200).json(result.rows);
  } catch (error) {
    console.error('Get deliveries error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Get all deliveries for a specific branch - this route must be BEFORE the /:id route
router.get('/branch', async (req, res) => {
  try {
    // Only allow branch users to access their own branch's deliveries
    if (req.user.role !== 'branch' && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Access denied. Branch or admin role required.' });
    }
    
    let query;
    let params = [];
    
    if (req.user.role === 'branch' && req.user.branch_id) {
      // Ensure branch_id is an integer
      const branchId = parseInt(req.user.branch_id, 10);
      if (isNaN(branchId)) {
        return res.status(400).json({ message: 'Invalid branch ID' });
      }
      
      // Branch users see ALL deliveries addressed to their branch
      // regardless of who created them
      query = `
        SELECT d.*, b.name as branch_name, u.username as created_by_user,
               dr.request_status as request_status, dr.id as request_id
        FROM deliveries d
        LEFT JOIN users u ON d.created_by = u.id
        LEFT JOIN branches b ON d.branch_id = b.id
        LEFT JOIN delivery_requests dr ON d.request_id = dr.id
        WHERE d.branch_id = $1
        ORDER BY d.created_at DESC
      `;
      params = [branchId];
    } else if (req.user.role === 'admin' && req.query.branchId) {
      // Ensure branchId is an integer
      const branchId = parseInt(req.query.branchId, 10);
      if (isNaN(branchId)) {
        return res.status(400).json({ message: 'Invalid branch ID in query' });
      }
      
      // Admin users can see deliveries for a specific branch
      query = `
        SELECT d.*, b.name as branch_name, u.username as created_by_user,
               dr.request_status as request_status, dr.id as request_id
        FROM deliveries d
        LEFT JOIN users u ON d.created_by = u.id
        LEFT JOIN branches b ON d.branch_id = b.id
        LEFT JOIN delivery_requests dr ON d.request_id = dr.id
        WHERE d.branch_id = $1
        ORDER BY d.created_at DESC
      `;
      params = [branchId];
    } else {
      // Admin without branch specified or fallback - return all deliveries
      query = `
        SELECT d.*, b.name as branch_name, u.username as created_by_user,
               dr.request_status as request_status, dr.id as request_id
        FROM deliveries d
        LEFT JOIN users u ON d.created_by = u.id
        LEFT JOIN branches b ON d.branch_id = b.id
        LEFT JOIN delivery_requests dr ON d.request_id = dr.id
        ORDER BY d.created_at DESC
      `;
    }
    
    const deliveriesResult = await db.query(query, params);
    res.json(deliveriesResult.rows);
  } catch (error) {
    console.error('Error fetching branch deliveries:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get delivery by id - this must come AFTER any specific routes
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    // Validate id is a number to prevent SQL injection
    const deliveryId = parseInt(id, 10);
    if (isNaN(deliveryId)) {
      return res.status(400).json({ error: 'Invalid delivery ID. Must be a number.' });
    }
    
    const result = await db.query(`
      SELECT d.*, u.username as created_by_user 
      FROM deliveries d
      LEFT JOIN users u ON d.created_by = u.id
      WHERE d.id = $1
    `, [deliveryId]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Delivery not found' });
    }
    
    res.status(200).json(result.rows[0]);
  } catch (error) {
    console.error('Get delivery error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Create new delivery
router.post('/', async (req, res) => {
  try {
    const { 
      recipient_name, 
      recipient_address, 
      recipient_phone, 
      package_description, 
      weight,
      delivery_date,
      status,
      branch_id,
      request_id
    } = req.body;
    
    // Basic validation
    if (!recipient_name || !recipient_address) {
      return res.status(400).json({ 
        error: 'Missing required fields: recipient name and address are required' 
      });
    }
    
    // Trim all string inputs to avoid length issues
    const trimmedRecipientName = recipient_name ? recipient_name.substring(0, 100) : '';
    const trimmedRecipientAddress = recipient_address ? recipient_address.substring(0, 200) : '';
    const trimmedRecipientPhone = recipient_phone ? recipient_phone.substring(0, 20) : null;
    const trimmedPackageDescription = package_description ? package_description.substring(0, 500) : null;
    
    // Parse branch_id as integer if provided
    const parsedBranchId = branch_id ? parseInt(branch_id, 10) : null;
    
    // Parse request_id as integer if provided
    const parsedRequestId = request_id ? parseInt(request_id, 10) : null;
    
    // If request_id is provided, verify it exists first
    if (parsedRequestId) {
      const requestCheck = await db.query('SELECT * FROM delivery_requests WHERE id = $1', [parsedRequestId]);
      if (requestCheck.rows.length === 0) {
        return res.status(400).json({ error: `Delivery request with ID ${parsedRequestId} not found` });
      }
      console.log(`Creating delivery from request ID: ${parsedRequestId}`);
    }
    
    // Generate a unique tracking number
    const timestamp = new Date().getTime();
    const randomPart = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
    let trackingNumber;
    
    if (parsedRequestId) {
      // Format: REQ-{requestId}-{timestamp}-{random}
      trackingNumber = `REQ-${parsedRequestId}-${timestamp.toString().slice(-6)}-${randomPart}`;
    } else {
      // Format: SBN-{timestamp}-{random}
      trackingNumber = `SBN-${timestamp.toString().slice(-6)}-${randomPart}`;
    }
    
    // Always use 'pending' for initial status to avoid VARCHAR issues
    const deliveryStatus = 'pending';
    
    // Ensure user is authenticated with a valid ID
    if (!req.user || !req.user.id) {
      return res.status(401).json({ error: 'Unauthorized: User ID is required' });
    }
    
    console.log(`Creating new delivery with tracking: ${trackingNumber}, status: ${deliveryStatus}`);
    
    const result = await db.query(`
      INSERT INTO deliveries (
        tracking_number, 
        recipient_name, 
        recipient_address, 
        recipient_phone, 
        package_description, 
        weight,
        delivery_date,
        status,
        branch_id,
        created_by,
        request_id
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
      RETURNING *
    `, [
      trackingNumber, 
      trimmedRecipientName, 
      trimmedRecipientAddress, 
      trimmedRecipientPhone, 
      trimmedPackageDescription, 
      weight || null,
      delivery_date || null,
      deliveryStatus,
      parsedBranchId,
      req.user.id,
      parsedRequestId
    ]);
    
    // Return full delivery with branch info
    const deliveryWithBranch = await db.query(`
      SELECT d.*, b.name as branch_name
      FROM deliveries d
      LEFT JOIN branches b ON d.branch_id = b.id
      WHERE d.id = $1
    `, [result.rows[0].id]);
    
    // If this delivery was created from a request, update the request status to "processing"
    if (parsedRequestId) {
      try {
        await db.query(`
          UPDATE delivery_requests 
          SET request_status = 'processing', updated_at = CURRENT_TIMESTAMP
          WHERE id = $1
        `, [parsedRequestId]);
        
        // Clear the processing status for this request
        await db.query(`
          DELETE FROM request_processing
          WHERE request_id = $1
        `, [parsedRequestId]);
      } catch (updateError) {
        console.error('Error updating request status:', updateError);
        // Continue even if update fails
      }
    }
    
    res.status(201).json(deliveryWithBranch.rows[0]);
  } catch (error) {
    console.error('Create delivery error:', error);
    
    if (error.code === '23505') { // Unique violation
      return res.status(400).json({ error: 'Tracking number already exists' });
    }
    
    res.status(500).json({ error: 'Server error' });
  }
});

// Update delivery
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { 
      tracking_number, 
      recipient_name, 
      recipient_address, 
      recipient_phone, 
      package_description, 
      weight,
      delivery_date,
      status,
      branch_id
    } = req.body;
    
    // Basic validation
    if (!tracking_number || !recipient_name || !recipient_address) {
      return res.status(400).json({ 
        error: 'Missing required fields: tracking number, recipient name, and address are required' 
      });
    }
    
    // Trim all string inputs to avoid length issues
    const trimmedTrackingNumber = tracking_number ? tracking_number.substring(0, 50) : '';
    const trimmedRecipientName = recipient_name ? recipient_name.substring(0, 100) : '';
    const trimmedRecipientAddress = recipient_address ? recipient_address.substring(0, 200) : '';
    const trimmedRecipientPhone = recipient_phone ? recipient_phone.substring(0, 20) : null;
    const trimmedPackageDescription = package_description ? package_description.substring(0, 500) : null;
    
    // Parse branch_id as integer if provided
    const parsedBranchId = branch_id ? parseInt(branch_id, 10) : null;
    
    // Validate status to ensure it doesn't exceed the VARCHAR(20) limit
    const validStatuses = ['pending', 'preparing', 'loading', 'in_transit', 'delivered', 'cancelled'];
    const deliveryStatus = status && validStatuses.includes(status) ? status : 'pending';
    
    const result = await db.query(`
      UPDATE deliveries SET
        tracking_number = $1,
        recipient_name = $2,
        recipient_address = $3,
        recipient_phone = $4,
        package_description = $5,
        weight = $6,
        delivery_date = $7,
        status = $8,
        branch_id = $9,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = $10
      RETURNING *
    `, [
      trimmedTrackingNumber, 
      trimmedRecipientName, 
      trimmedRecipientAddress, 
      trimmedRecipientPhone, 
      trimmedPackageDescription, 
      weight || null,
      delivery_date || null,
      deliveryStatus,
      parsedBranchId,
      id
    ]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Delivery not found' });
    }
    
    // Return full delivery with branch info
    const deliveryWithBranch = await db.query(`
      SELECT d.*, b.name as branch_name
      FROM deliveries d
      LEFT JOIN branches b ON d.branch_id = b.id
      WHERE d.id = $1
    `, [id]);
    
    res.status(200).json(deliveryWithBranch.rows[0]);
  } catch (error) {
    console.error('Update delivery error:', error);
    
    if (error.code === '23505') { // Unique violation
      return res.status(400).json({ error: 'Tracking number already exists' });
    }
    
    res.status(500).json({ error: 'Server error' });
  }
});

// Delete delivery
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    const result = await db.query(
      'DELETE FROM deliveries WHERE id = $1 RETURNING *',
      [id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Delivery not found' });
    }
    
    res.status(200).json({ message: 'Delivery deleted successfully' });
  } catch (error) {
    console.error('Delete delivery error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Confirm receipt of delivery (branch users)
router.put('/:id/confirm-receipt', async (req, res) => {
  try {
    const deliveryId = parseInt(req.params.id, 10);
    if (isNaN(deliveryId)) {
      return res.status(400).json({ message: 'Invalid delivery ID' });
    }
    
    // Check if delivery exists
    const deliveryResult = await db.query(
      'SELECT * FROM deliveries WHERE id = $1',
      [deliveryId]
    );
    
    if (deliveryResult.rows.length === 0) {
      return res.status(404).json({ message: 'Delivery not found' });
    }
    
    const delivery = deliveryResult.rows[0];
    
    // Check if user has permission (branch user or admin)
    if (req.user.role === 'branch') {
      const userBranchId = parseInt(req.user.branch_id, 10);
      const deliveryBranchId = parseInt(delivery.branch_id, 10);
      
      if (isNaN(userBranchId) || isNaN(deliveryBranchId) || userBranchId !== deliveryBranchId) {
        return res.status(403).json({ message: 'Access denied. You can only confirm deliveries for your branch.' });
      }
    }
    
    // Only confirm if status is "in_transit"
    if (delivery.status !== 'in_transit') {
      return res.status(400).json({ message: 'Only in-transit deliveries can be confirmed as received' });
    }
    
    // Update delivery status
    const updateResult = await db.query(
      `UPDATE deliveries 
       SET status = 'delivered',
           received_at = NOW(),
           received_by = $1,
           updated_at = NOW()
       WHERE id = $2
       RETURNING *`,
      [req.user.id, deliveryId]
    );
    
    // If this delivery is connected to a request, update the request status too
    if (delivery.request_id) {
      try {
        await db.query(`
          UPDATE delivery_requests 
          SET request_status = 'delivered', updated_at = CURRENT_TIMESTAMP
          WHERE id = $1
        `, [delivery.request_id]);
        
        console.log(`Updated request ${delivery.request_id} status to delivered`);
      } catch (updateError) {
        console.error('Error updating request status:', updateError);
        // Continue even if this update fails
      }
    }
    
    // Get updated delivery with relations
    const updatedDeliveryResult = await db.query(
      `SELECT d.*, b.name as branch_name, u.username as driver_name
       FROM deliveries d
       LEFT JOIN branches b ON d.branch_id = b.id
       LEFT JOIN users u ON d.driver_id = u.id
       WHERE d.id = $1`,
      [deliveryId]
    );
    
    res.json(updatedDeliveryResult.rows[0]);
  } catch (error) {
    console.error('Error confirming delivery receipt:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Update delivery status only
router.put('/:id/status', async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    
    // Validate delivery ID
    const deliveryId = parseInt(id, 10);
    if (isNaN(deliveryId)) {
      return res.status(400).json({ error: 'Invalid delivery ID. Must be a number.' });
    }
    
    // Basic validation
    if (!status) {
      return res.status(400).json({ error: 'Status is required' });
    }
    
    // Validate status
    const validStatuses = ['pending', 'preparing', 'loading', 'in_transit', 'delivered', 'cancelled'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ error: 'Invalid status value' });
    }
    
    // Ensure status is correct length for the database field (VARCHAR(20))
    const trimmedStatus = status.substring(0, 20);
    
    // Check if delivery exists
    const checkResult = await db.query('SELECT * FROM deliveries WHERE id = $1', [deliveryId]);
    if (checkResult.rows.length === 0) {
      return res.status(404).json({ error: 'Delivery not found' });
    }
    
    const currentDelivery = checkResult.rows[0];
    
    // Set received_at timestamp if status is being changed to 'delivered'
    let queryParams = [trimmedStatus, deliveryId];
    let updateQuery = `
      UPDATE deliveries SET
        status = $1,
        updated_at = CURRENT_TIMESTAMP
    `;
    
    // Add received_at and received_by if status is changing to delivered
    if (trimmedStatus === 'delivered' && currentDelivery.status !== 'delivered') {
      updateQuery += `,
        received_at = CURRENT_TIMESTAMP,
        received_by = $3
      `;
      queryParams.push(req.user.id);
    }
    
    updateQuery += `
      WHERE id = $2
      RETURNING *
    `;
    
    // Update the delivery
    const result = await db.query(updateQuery, queryParams);
    
    // Return full delivery with branch info
    const deliveryWithBranch = await db.query(`
      SELECT d.*, b.name as branch_name
      FROM deliveries d
      LEFT JOIN branches b ON d.branch_id = b.id
      WHERE d.id = $1
    `, [deliveryId]);
    
    // If the delivery is connected to a request, update the request status too
    if (currentDelivery.request_id) {
      try {
        // Map delivery status to request status
        let requestStatus;
        if (trimmedStatus === 'delivered') {
          requestStatus = 'delivered';
        } else if (['in_transit', 'loading'].includes(trimmedStatus)) {
          requestStatus = 'processing';
        }
        
        if (requestStatus) {
          await db.query(`
            UPDATE delivery_requests 
            SET request_status = $1, updated_at = CURRENT_TIMESTAMP
            WHERE id = $2
          `, [requestStatus, currentDelivery.request_id]);
          
          console.log(`Updated request ${currentDelivery.request_id} status to ${requestStatus}`);
        }
      } catch (updateError) {
        console.error('Error updating request status:', updateError);
        // Continue even if this update fails
      }
    }
    
    res.status(200).json(deliveryWithBranch.rows[0]);
  } catch (error) {
    console.error('Update delivery status error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;