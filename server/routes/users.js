const express = require('express');
const db = require('../db');
const { authenticateToken, isAdmin } = require('../middleware/auth');
const router = express.Router();

// Apply authentication middleware to all user routes
router.use(authenticateToken);

// Get all users (admin only)
router.get('/', isAdmin, async (req, res) => {
  try {
    const result = await db.query(`
      SELECT u.id, u.username, u.email, u.full_name, u.role, u.branch_id, b.name as branch_name 
      FROM users u
      LEFT JOIN branches b ON u.branch_id = b.id
      ORDER BY u.id
    `);
    
    res.status(200).json(result.rows);
  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Get all branch users (for warehouse and admin to select delivery recipients)
// IMPORTANT: This route must be defined BEFORE the '/:id' route to avoid conflicts
router.get('/branches', async (req, res) => {
  try {
    const { role } = req.user;
    
    // Only admin and warehouse users can access this endpoint
    if (role !== 'admin' && role !== 'warehouse') {
      return res.status(403).json({ error: 'Unauthorized' });
    }
    
    const result = await db.query(`
      SELECT u.id, u.username, u.email, u.full_name, u.role, 
             u.branch_id, b.name as branch_name, b.address as branch_address,
             b.phone as branch_phone
      FROM users u
      JOIN branches b ON u.branch_id = b.id
      WHERE u.role = 'branch'
      ORDER BY b.name, u.full_name
    `);
    
    res.status(200).json(result.rows);
  } catch (error) {
    console.error('Get all branch users error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Get branch users (for admin and warehouse users)
router.get('/branch/:branchId', async (req, res) => {
  try {
    const { role } = req.user;
    const { branchId } = req.params;
    
    // Only admin and warehouse users can view branch users
    if (role !== 'admin' && role !== 'warehouse') {
      return res.status(403).json({ error: 'Unauthorized' });
    }
    
    const result = await db.query(`
      SELECT u.id, u.username, u.email, u.full_name, u.role, u.branch_id, b.name as branch_name
      FROM users u
      LEFT JOIN branches b ON u.branch_id = b.id
      WHERE u.branch_id = $1
      ORDER BY u.id
    `, [branchId]);
    
    res.status(200).json(result.rows);
  } catch (error) {
    console.error('Get branch users error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Get all users for directory (admin/authorized users only)
router.get('/directory/all', async (req, res) => {
  try {
    const userRole = req.user.role;
    
    // Only admin and authenticated users can access directory
    if (userRole !== 'admin' && userRole !== 'warehouse' && userRole !== 'branch') {
      return res.status(403).json({ error: 'Unauthorized access to directory' });
    }
    
    // Join with branches to get branch information
    const query = `
      SELECT 
        u.id, 
        u.username, 
        u.email, 
        u.full_name, 
        u.phone, 
        u.address,
        u.profile_picture_url,
        u.role,
        u.branch_id,
        u.created_at,
        b.name as branch_name,
        b.address as branch_address,
        b.phone as branch_phone
      FROM users u
      LEFT JOIN branches b ON u.branch_id = b.id
      ORDER BY u.role, u.full_name, u.username
    `;
    
    const result = await db.query(query);
    
    // Remove sensitive information
    const users = result.rows.map(user => {
      const { password, ...userData } = user;
      return userData;
    });
    
    res.json(users);
  } catch (error) {
    console.error('Error fetching users directory:', error);
    res.status(500).json({ error: 'Server error fetching users directory' });
  }
});

// Get user by ID (admin can view any user, others can only view themselves)
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { role, id: userId } = req.user;
    
    // Only admin or the user themselves can view user details
    if (role !== 'admin' && userId !== parseInt(id)) {
      return res.status(403).json({ error: 'Unauthorized to view this user' });
    }
    
    const result = await db.query(`
      SELECT u.id, u.username, u.email, u.full_name, u.role, u.branch_id, 
             b.name as branch_name, b.address as branch_address, b.phone as branch_phone
      FROM users u
      LEFT JOIN branches b ON u.branch_id = b.id
      WHERE u.id = $1
    `, [id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    res.status(200).json(result.rows[0]);
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Create new user (admin only)
router.post('/', isAdmin, async (req, res) => {
  try {
    const { username, password, email, full_name, role, branch_id } = req.body;
    
    // Validation
    if (!username || !password || !email || !role) {
      return res.status(400).json({ error: 'Username, password, email, and role are required' });
    }
    
    // Check if username or email already exists
    const checkResult = await db.query(
      'SELECT id FROM users WHERE username = $1 OR email = $2',
      [username, email]
    );
    
    if (checkResult.rows.length > 0) {
      return res.status(400).json({ error: 'Username or email already exists' });
    }
    
    // Use plaintext password instead of hashing
    const plainTextPassword = password;
    
    // Check if branch_id is valid when provided
    let parsedBranchId = null;
    if (branch_id) {
      parsedBranchId = parseInt(branch_id, 10);
      
      if (isNaN(parsedBranchId)) {
        return res.status(400).json({ error: 'Invalid branch ID' });
      }
      
      const branchCheck = await db.query('SELECT id FROM branches WHERE id = $1', [parsedBranchId]);
      
      if (branchCheck.rows.length === 0) {
        return res.status(400).json({ error: 'Branch not found' });
      }
    }
    
    // Validate role
    const validRoles = ['admin', 'warehouse', 'branch'];
    if (!validRoles.includes(role)) {
      return res.status(400).json({ error: 'Invalid role. Must be admin, warehouse, or branch' });
    }
    
    // If role is branch, branch_id is required
    if (role === 'branch' && !parsedBranchId) {
      return res.status(400).json({ error: 'Branch ID is required for branch users' });
    }
    
    // Create user
    const result = await db.query(`
      INSERT INTO users (username, password, email, full_name, role, branch_id)
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING id, username, email, full_name, role, branch_id
    `, [
      username,
      plainTextPassword,
      email,
      full_name || null,
      role,
      parsedBranchId
    ]);
    
    // Get branch name if applicable
    let user = result.rows[0];
    
    if (user.branch_id) {
      const branchResult = await db.query('SELECT name FROM branches WHERE id = $1', [user.branch_id]);
      
      if (branchResult.rows.length > 0) {
        user.branch_name = branchResult.rows[0].name;
      }
    }
    
    res.status(201).json(user);
  } catch (error) {
    console.error('Create user error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Update user (admin can update any user, others can only update themselves)
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { role, id: userId } = req.user;
    const { 
      email, 
      full_name, 
      phone, 
      address, 
      profile_picture_url,
      password, 
      current_password, 
      role: newRole, 
      branch_id,
      username 
    } = req.body;
    
    // Only admin or the user themselves can update user details
    if (role !== 'admin' && userId !== parseInt(id)) {
      return res.status(403).json({ error: 'Unauthorized to update this user' });
    }
    
    // Only admin can change roles
    if (role !== 'admin' && newRole && newRole !== role) {
      return res.status(403).json({ error: 'Only admin can change user roles' });
    }
    
    // Check if user exists
    const userCheck = await db.query('SELECT * FROM users WHERE id = $1', [id]);
    
    if (userCheck.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    const existingUser = userCheck.rows[0];
    
    // Check if username is already taken if username is being changed
    if (username && username !== existingUser.username) {
      const usernameCheck = await db.query('SELECT id FROM users WHERE username = $1 AND id != $2', [username, id]);
      if (usernameCheck.rows.length > 0) {
        return res.status(400).json({ error: 'Username is already taken' });
      }
    }
    
    // Verify current password if provided
    if (password && current_password) {
      // Direct string comparison instead of bcrypt
      const isValidPassword = (current_password === existingUser.password);
      
      if (!isValidPassword) {
        return res.status(400).json({ error: 'Current password is incorrect' });
      }
    }
    
    // Build the update query dynamically
    const updates = [];
    const values = [];
    let paramIndex = 1;
    
    if (username) {
      updates.push(`username = $${paramIndex}`);
      values.push(username);
      paramIndex++;
    }
    
    if (email) {
      updates.push(`email = $${paramIndex}`);
      values.push(email);
      paramIndex++;
    }
    
    if (full_name !== undefined) {
      updates.push(`full_name = $${paramIndex}`);
      values.push(full_name);
      paramIndex++;
    }
    
    if (phone !== undefined) {
      updates.push(`phone = $${paramIndex}`);
      values.push(phone);
      paramIndex++;
    }
    
    if (address !== undefined) {
      updates.push(`address = $${paramIndex}`);
      values.push(address);
      paramIndex++;
    }
    
    // Handle the case when profile_picture_url is explicitly set to null (for removal)
    if (profile_picture_url !== undefined) {
      console.log('profile_picture_url value:', profile_picture_url);
      
      if (profile_picture_url === null) {
        // For NULL values, we don't use parameterized query to ensure SQL NULL is used
        updates.push(`profile_picture_url = NULL`);
        console.log('Added SQL update for NULL profile_picture_url');
      } else {
        updates.push(`profile_picture_url = $${paramIndex}`);
        values.push(profile_picture_url);
        paramIndex++;
        console.log('Added parameterized update for profile_picture_url:', profile_picture_url);
      }
    }
    
    if (password && current_password) {
      // Store password as plaintext
      updates.push(`password = $${paramIndex}`);
      values.push(password);
      paramIndex++;
    }
    
    if (role === 'admin' && newRole) {
      // Validate role
      const validRoles = ['admin', 'warehouse', 'branch'];
      if (!validRoles.includes(newRole)) {
        return res.status(400).json({ error: 'Invalid role. Must be admin, warehouse, or branch' });
      }
      
      updates.push(`role = $${paramIndex}`);
      values.push(newRole);
      paramIndex++;
    }
    
    if (role === 'admin' && branch_id !== undefined) {
      let parsedBranchId = null;
      
      if (branch_id) {
        parsedBranchId = parseInt(branch_id, 10);
        
        if (isNaN(parsedBranchId)) {
          return res.status(400).json({ error: 'Invalid branch ID' });
        }
        
        const branchCheck = await db.query('SELECT id FROM branches WHERE id = $1', [parsedBranchId]);
        
        if (branchCheck.rows.length === 0) {
          return res.status(400).json({ error: 'Branch not found' });
        }
      }
      
      updates.push(`branch_id = $${paramIndex}`);
      values.push(parsedBranchId);
      paramIndex++;
    }
    
    // If no updates, return the user
    if (updates.length === 0) {
      const result = await db.query(`
        SELECT u.id, u.username, u.email, u.full_name, u.role, u.branch_id, 
               u.phone, u.address, u.profile_picture_url, u.created_at,
               b.name as branch_name
        FROM users u
        LEFT JOIN branches b ON u.branch_id = b.id
        WHERE u.id = $1
      `, [id]);
      
      return res.status(200).json(result.rows[0]);
    }
    
    // Add the user ID parameter
    values.push(id);
    
    // Construct and run the query
    const query = `
      UPDATE users
      SET ${updates.join(', ')}, updated_at = CURRENT_TIMESTAMP
      WHERE id = $${paramIndex}
      RETURNING id, username, email, full_name, role, branch_id, phone, address, profile_picture_url, created_at
    `;
    
    console.log('Executing SQL query:', query);
    console.log('With values:', values);
    
    const result = await db.query(query, values);
    
    // Get branch name if applicable
    let user = result.rows[0];
    
    if (user.branch_id) {
      const branchResult = await db.query('SELECT name FROM branches WHERE id = $1', [user.branch_id]);
      
      if (branchResult.rows.length > 0) {
        user.branch_name = branchResult.rows[0].name;
      }
    }
    
    res.status(200).json(user);
  } catch (error) {
    console.error('Update user error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Delete user (admin only)
router.delete('/:id', isAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    
    // Check if user exists
    const userCheck = await db.query('SELECT id FROM users WHERE id = $1', [id]);
    
    if (userCheck.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    // Delete user
    await db.query('DELETE FROM users WHERE id = $1', [id]);
    
    res.status(200).json({ message: 'User deleted successfully' });
  } catch (error) {
    console.error('Delete user error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router; 