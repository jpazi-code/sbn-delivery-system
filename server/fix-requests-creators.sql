-- Fix delivery request creator associations

-- Set admin as creator for any null values
UPDATE delivery_requests 
SET created_by_id = (SELECT id FROM users WHERE username = 'admin')
WHERE created_by_id IS NULL;

-- Show the changes
SELECT 
  id, 
  created_by_id, 
  (SELECT username FROM users WHERE id = created_by_id) as creator_username,
  (SELECT full_name FROM users WHERE id = created_by_id) as creator_full_name
FROM delivery_requests 
ORDER BY id DESC 
LIMIT 10; 