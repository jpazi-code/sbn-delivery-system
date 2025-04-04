-- Reset all user passwords to plain text 'password123'
UPDATE users 
SET password = 'password123', 
    updated_at = NOW();

-- Confirm the update
SELECT id, username, password, updated_at FROM users; 