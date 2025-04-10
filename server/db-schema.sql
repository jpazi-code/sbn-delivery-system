-- Drop existing tables if they exist
DROP TABLE IF EXISTS delivery_request_items CASCADE;
DROP TABLE IF EXISTS request_processing CASCADE;
DROP TABLE IF EXISTS delivery_requests CASCADE;
DROP TABLE IF EXISTS deliveries CASCADE;
DROP TABLE IF EXISTS users CASCADE;
DROP TABLE IF EXISTS branches CASCADE;

-- Branches Table
CREATE TABLE IF NOT EXISTS branches (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  address TEXT,
  phone TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Users Table
CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  username VARCHAR(50) UNIQUE NOT NULL,
  password VARCHAR(100) NOT NULL,
  email VARCHAR(100) UNIQUE NOT NULL,
  full_name VARCHAR(100),
  phone VARCHAR(20),
  address TEXT,
  profile_picture_url TEXT,
  role VARCHAR(20) DEFAULT 'user',
  branch_id INTEGER REFERENCES branches(id) ON DELETE SET NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- DeliveryRequests Table (for branch users requesting hardware supplies)
CREATE TABLE IF NOT EXISTS delivery_requests (
  id SERIAL PRIMARY KEY,
  branch_id INTEGER REFERENCES branches(id) NOT NULL,
  priority VARCHAR(20) NOT NULL DEFAULT 'medium',
  delivery_date DATE,
  request_status VARCHAR(20) NOT NULL DEFAULT 'pending',
  reason TEXT,
  notes TEXT,
  total_amount DECIMAL(10, 2) DEFAULT 0,
  processed_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
  created_by_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
  is_archived BOOLEAN DEFAULT FALSE,
  archived_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
  archived_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Deliveries Table
CREATE TABLE IF NOT EXISTS deliveries (
  id SERIAL PRIMARY KEY,
  tracking_number VARCHAR(50) UNIQUE NOT NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'pending',
  recipient_name VARCHAR(100) NOT NULL,
  recipient_address TEXT NOT NULL,
  recipient_phone VARCHAR(20),
  package_description TEXT,
  weight DECIMAL(10, 2),
  delivery_date TIMESTAMP,
  received_at TIMESTAMP,
  received_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
  priority VARCHAR(20) DEFAULT 'medium',
  branch_id INTEGER REFERENCES branches(id) ON DELETE SET NULL,
  driver_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
  created_by INTEGER REFERENCES users(id),
  request_id INTEGER REFERENCES delivery_requests(id) ON DELETE SET NULL,
  cancel_reason TEXT,
  is_archived BOOLEAN DEFAULT FALSE,
  archived_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
  archived_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Delivery Request Items Table
CREATE TABLE IF NOT EXISTS delivery_request_items (
  id SERIAL PRIMARY KEY,
  request_id INTEGER REFERENCES delivery_requests(id) ON DELETE CASCADE,
  item_code VARCHAR(50),
  description VARCHAR(200) NOT NULL,
  quantity INTEGER NOT NULL,
  unit VARCHAR(50) NOT NULL,
  unit_price DECIMAL(10, 2) NOT NULL,
  subtotal DECIMAL(10, 2) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Table to track which delivery requests are being processed and by whom
CREATE TABLE IF NOT EXISTS request_processing (
  id SERIAL PRIMARY KEY,
  request_id INTEGER NOT NULL REFERENCES delivery_requests(id) ON DELETE CASCADE,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  started_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(request_id)
);

-- Sample Data - Branches
INSERT INTO branches (name, address, phone) VALUES
('STRONGHOLD BOLTS AND NUTS CORPORATION', '445 Edsa Street, Pasay City', '84045609 / 88891220 / 88346545 / 84037374'),
('STRONGFIX BOLTS AND NUTS CENTER - SUCAT', '8145 Dra. Santos Avenue, Sucat, Paranaque', '8360199 / 8463-5486 / 88043084'),
('STRONGFIX BOLTS AND NUTS CENTER - LIPA', 'Purok 1, Tambo, Lipa City, Batangas', '043-7742179 / 781-9752'),
('STRONGHOLD HARDWARE', '1165 B Quezon Avenue, Quezon City', '83324911 / 84635499 / 83732131'),
('SCREWFIX INDUSTRIAL CORPORATION', '553 J.P. Laurel Hi-Way, Malvar, Batangas', '043-7401027 / 7030542');

-- Sample Data - Users
-- bcrypt hash for 'password123'
INSERT INTO users (username, password, email, full_name, phone, address, role, branch_id) VALUES
('admin', '$2a$10$9LQB75.JoAqSVoSeryAmxuDv.GpMESVL9Wg2cbE.T.BHxG1OW19lW', 'admin@example.com', 'Admin User', '+63-917-123-4567', 'Central Office, Manila', 'admin', NULL),
('warehouse1', '$2a$10$9LQB75.JoAqSVoSeryAmxuDv.GpMESVL9Wg2cbE.T.BHxG1OW19lW', 'warehouse1@example.com', 'Warehouse User 1', '+63-918-234-5678', 'Warehouse Complex, Quezon City', 'warehouse', NULL),
('warehouse2', '$2a$10$9LQB75.JoAqSVoSeryAmxuDv.GpMESVL9Wg2cbE.T.BHxG1OW19lW', 'warehouse2@example.com', 'Warehouse User 2', '+63-918-444-5678', 'Warehouse Complex, Quezon City', 'warehouse', NULL),
('branch1', '$2a$10$9LQB75.JoAqSVoSeryAmxuDv.GpMESVL9Wg2cbE.T.BHxG1OW19lW', 'branch1@example.com', 'SBNC Pasay Branch', '+63-919-345-6789', '445 Edsa Street, Pasay City', 'branch', 1),
('branch2', '$2a$10$9LQB75.JoAqSVoSeryAmxuDv.GpMESVL9Wg2cbE.T.BHxG1OW19lW', 'branch2@example.com', 'Sucat Branch User', '+63-920-456-7890', '8145 Dra. Santos Avenue, Sucat, Paranaque', 'branch', 2),
('branch3', '$2a$10$9LQB75.JoAqSVoSeryAmxuDv.GpMESVL9Wg2cbE.T.BHxG1OW19lW', 'branch3@example.com', 'Lipa Branch User', '+63-921-567-8901', 'Purok 1, Tambo, Lipa City, Batangas', 'branch', 3),
('branch4', '$2a$10$9LQB75.JoAqSVoSeryAmxuDv.GpMESVL9Wg2cbE.T.BHxG1OW19lW', 'branch4@example.com', 'QC Hardware User', '+63-922-678-9012', '1165 B Quezon Avenue, Quezon City', 'branch', 4),
('branch5', '$2a$10$9LQB75.JoAqSVoSeryAmxuDv.GpMESVL9Wg2cbE.T.BHxG1OW19lW', 'branch5@example.com', 'Malvar Branch User', '+63-923-789-0123', '553 J.P. Laurel Hi-Way, Malvar, Batangas', 'branch', 5),
('driver1', '$2a$10$9LQB75.JoAqSVoSeryAmxuDv.GpMESVL9Wg2cbE.T.BHxG1OW19lW', 'driver1@example.com', 'Driver User 1', '+63-917-111-2222', 'Delivery Center, Quezon City', 'driver', NULL),
('driver2', '$2a$10$9LQB75.JoAqSVoSeryAmxuDv.GpMESVL9Wg2cbE.T.BHxG1OW19lW', 'driver2@example.com', 'Driver User 2', '+63-917-333-4444', 'Delivery Center, Quezon City', 'driver', NULL);

-- Sample Delivery Requests (with different statuses and for different branches)
INSERT INTO delivery_requests (branch_id, priority, delivery_date, request_status, notes, total_amount, processed_by, created_at) VALUES
-- Branch 1 Requests
(1, 'high', CURRENT_DATE + INTERVAL '3 days', 'pending', 'Urgent stock needed for upcoming project', 12500.50, NULL, CURRENT_TIMESTAMP - INTERVAL '10 days'),
(1, 'medium', CURRENT_DATE + INTERVAL '5 days', 'approved', 'Regular monthly order', 8750.25, 2, CURRENT_TIMESTAMP - INTERVAL '8 days'),
(1, 'low', CURRENT_DATE + INTERVAL '7 days', 'processing', 'Additional items for store display', 5200.75, 2, CURRENT_TIMESTAMP - INTERVAL '15 days'),
(1, 'high', CURRENT_DATE - INTERVAL '2 days', 'delivered', 'Emergency restock', 9800.00, 2, CURRENT_TIMESTAMP - INTERVAL '20 days'),
(1, 'medium', CURRENT_DATE - INTERVAL '15 days', 'delivered', 'Regular order', 7500.50, 2, CURRENT_TIMESTAMP - INTERVAL '30 days'),

-- Branch 2 Requests
(2, 'high', CURRENT_DATE + INTERVAL '2 days', 'pending', 'Critical items for major customer', 15200.75, NULL, CURRENT_TIMESTAMP - INTERVAL '3 days'),
(2, 'medium', CURRENT_DATE + INTERVAL '4 days', 'approved', 'Standard restock order', 10500.25, 2, CURRENT_TIMESTAMP - INTERVAL '7 days'),
(2, 'high', CURRENT_DATE - INTERVAL '3 days', 'delivered', 'Rush order for special client', 13750.00, 2, CURRENT_TIMESTAMP - INTERVAL '15 days'),
(2, 'low', CURRENT_DATE - INTERVAL '10 days', 'delivered', 'Supplementary inventory', 5300.50, 2, CURRENT_TIMESTAMP - INTERVAL '25 days'),

-- Branch 3 Requests
(3, 'medium', CURRENT_DATE + INTERVAL '5 days', 'pending', 'Scheduled restock', 9500.00, NULL, CURRENT_TIMESTAMP - INTERVAL '2 days'),
(3, 'high', CURRENT_DATE + INTERVAL '3 days', 'approved', 'Items for store renovation', 18200.50, 3, CURRENT_TIMESTAMP - INTERVAL '5 days'),
(3, 'medium', CURRENT_DATE - INTERVAL '5 days', 'delivered', 'Regular monthly order', 11500.25, 3, CURRENT_TIMESTAMP - INTERVAL '20 days'),

-- Branch 4 Requests
(4, 'low', CURRENT_DATE + INTERVAL '7 days', 'pending', 'Non-urgent items', 4200.00, NULL, CURRENT_TIMESTAMP - INTERVAL '1 day'),
(4, 'high', CURRENT_DATE + INTERVAL '1 day', 'approved', 'Critical stock shortage items', 16800.75, 2, CURRENT_TIMESTAMP - INTERVAL '3 days'),
(4, 'medium', CURRENT_DATE - INTERVAL '4 days', 'delivered', 'Scheduled delivery items', 9750.50, 2, CURRENT_TIMESTAMP - INTERVAL '12 days'),
(4, 'high', CURRENT_DATE - INTERVAL '12 days', 'delivered', 'Emergency replacement parts', 13200.25, 2, CURRENT_TIMESTAMP - INTERVAL '18 days'),

-- Branch 5 Requests
(5, 'medium', CURRENT_DATE + INTERVAL '4 days', 'pending', 'Regular stock items', 8200.50, NULL, CURRENT_TIMESTAMP - INTERVAL '2 days'),
(5, 'high', CURRENT_DATE + INTERVAL '2 days', 'approved', 'Important seasonal items', 14500.75, 3, CURRENT_TIMESTAMP - INTERVAL '4 days'),
(5, 'low', CURRENT_DATE - INTERVAL '7 days', 'delivered', 'Additional storage items', 6300.25, 3, CURRENT_TIMESTAMP - INTERVAL '15 days'),
(5, 'medium', CURRENT_DATE - INTERVAL '14 days', 'delivered', 'Standard monthly order', 10200.00, 3, CURRENT_TIMESTAMP - INTERVAL '22 days'),
(5, 'high', CURRENT_DATE - INTERVAL '20 days', 'rejected', 'Order submitted incorrectly', 11500.50, 2, CURRENT_TIMESTAMP - INTERVAL '25 days');

-- Sample Delivery Request Items
INSERT INTO delivery_request_items (request_id, item_code, description, quantity, unit, unit_price, subtotal) VALUES
-- Items for Request 1
(1, 'BLT-001', 'Hex Bolts M8x50mm Stainless Steel', 500, 'pcs', 5.50, 2750.00),
(1, 'NUT-002', 'Hex Nuts M8 Stainless Steel', 500, 'pcs', 3.50, 1750.00),
(1, 'WSH-003', 'Flat Washers M8 Stainless Steel', 750, 'pcs', 2.00, 1500.00),
(1, 'ANC-004', 'Wall Anchors 10mm', 1000, 'pcs', 4.50, 4500.00),
(1, 'SCR-005', 'Self-Drilling Screws 4.2x32mm', 800, 'pcs', 2.50, 2000.50),

-- Items for Request 2
(2, 'BLT-010', 'Carriage Bolts M10x80mm', 300, 'pcs', 7.50, 2250.00),
(2, 'NUT-011', 'Lock Nuts M10', 300, 'pcs', 4.00, 1200.00),
(2, 'WSH-012', 'Split Washers M10', 400, 'pcs', 2.25, 900.00),
(2, 'SCR-013', 'Drywall Screws 3.5x25mm', 1500, 'pcs', 1.80, 2700.00),
(2, 'ANC-014', 'Toggle Bolts 1/4 inch', 425, 'pcs', 4.00, 1700.25),

-- Items for Request 3
(3, 'BLT-020', 'U-Bolts 1/2 inch', 200, 'pcs', 8.50, 1700.00),
(3, 'SCR-021', 'Wood Screws 5x50mm', 1000, 'pcs', 2.20, 2200.00),
(3, 'NSL-022', 'Concrete Nails 3 inch', 650, 'pcs', 2.00, 1300.75),

-- Items for other requests (summarized)
(4, 'BLT-030', 'Eye Bolts M12', 150, 'pcs', 15.00, 2250.00),
(4, 'HDW-031', 'Door Hinges 4 inch', 200, 'pairs', 18.00, 3600.00),
(4, 'LCK-032', 'Padlocks 50mm', 120, 'pcs', 33.00, 3950.00),

(5, 'SCR-040', 'Machine Screws M5x20mm', 800, 'pcs', 2.50, 2000.00),
(5, 'NUT-041', 'Wing Nuts M5', 500, 'pcs', 3.50, 1750.00),
(5, 'WSH-042', 'Fender Washers M5', 750, 'pcs', 2.20, 1650.00),
(5, 'BLT-043', 'J-Bolts 3/8 inch', 300, 'pcs', 7.00, 2100.50),

(6, 'STP-050', 'Steel Pipes 1 inch (6m length)', 50, 'pcs', 180.00, 9000.00),
(6, 'FTG-051', 'Pipe Fittings Assorted', 250, 'pcs', 15.00, 3750.00),
(6, 'VLV-052', 'Ball Valves 1 inch', 60, 'pcs', 40.85, 2451.00),

(10, 'ANC-060', 'Expansion Anchors 12mm', 400, 'pcs', 6.50, 2600.00),
(10, 'BLT-061', 'Hex Bolts M12x75mm Galvanized', 350, 'pcs', 9.00, 3150.00),
(10, 'NUT-062', 'Hex Nuts M12 Galvanized', 400, 'pcs', 5.00, 2000.00),
(10, 'WSH-063', 'Flat Washers M12 Galvanized', 500, 'pcs', 3.50, 1750.00);

-- Sample Deliveries (with different statuses and for different branches)
INSERT INTO deliveries (tracking_number, status, recipient_name, recipient_address, recipient_phone, package_description, weight, delivery_date, priority, branch_id, driver_id, created_by, request_id, created_at) VALUES
-- Pending Deliveries
('SBN-100001-0001', 'pending', 'SBNC Pasay Branch', '445 Edsa Street, Pasay City', '84045609', 'Hardware supplies - Bolts and nuts', 45.5, CURRENT_TIMESTAMP + INTERVAL '3 days', 'high', 1, NULL, 2, 2, CURRENT_TIMESTAMP - INTERVAL '8 days'),
('SBN-100002-0002', 'pending', 'Sucat Branch User', '8145 Dra. Santos Avenue, Sucat, Paranaque', '8360199', 'Hardware supplies - Fasteners and tools', 32.8, CURRENT_TIMESTAMP + INTERVAL '4 days', 'medium', 2, NULL, 2, 7, CURRENT_TIMESTAMP - INTERVAL '7 days'),
('SBN-100003-0003', 'pending', 'Lipa Branch User', 'Purok 1, Tambo, Lipa City, Batangas', '043-7742179', 'Construction materials', 68.2, CURRENT_TIMESTAMP + INTERVAL '5 days', 'medium', 3, NULL, 3, 11, CURRENT_TIMESTAMP - INTERVAL '5 days'),
('SBN-100004-0004', 'pending', 'QC Hardware User', '1165 B Quezon Avenue, Quezon City', '83324911', 'Specialized tools and parts', 27.3, CURRENT_TIMESTAMP + INTERVAL '1 day', 'high', 4, NULL, 2, 14, CURRENT_TIMESTAMP - INTERVAL '3 days'),

-- Preparing Deliveries
('SBN-100005-0005', 'preparing', 'SBNC Pasay Branch', '445 Edsa Street, Pasay City', '84045609', 'Monthly stock supplies', 52.7, CURRENT_TIMESTAMP + INTERVAL '2 days', 'medium', 1, NULL, 2, 3, CURRENT_TIMESTAMP - INTERVAL '15 days'),
('SBN-100006-0006', 'preparing', 'Malvar Branch User', '553 J.P. Laurel Hi-Way, Malvar, Batangas', '043-7401027', 'Seasonal stock items', 41.5, CURRENT_TIMESTAMP + INTERVAL '2 days', 'high', 5, NULL, 3, 18, CURRENT_TIMESTAMP - INTERVAL '4 days'),

-- Loading Deliveries
('SBN-100007-0007', 'loading', 'Sucat Branch User', '8145 Dra. Santos Avenue, Sucat, Paranaque', '8360199', 'Rush order hardware', 37.2, CURRENT_TIMESTAMP + INTERVAL '1 day', 'high', 2, 9, 2, NULL, CURRENT_TIMESTAMP - INTERVAL '1 day'),
('SBN-100008-0008', 'loading', 'QC Hardware User', '1165 B Quezon Avenue, Quezon City', '83324911', 'Critical replacement parts', 23.8, CURRENT_DATE, 'high', 4, 10, 2, NULL, CURRENT_TIMESTAMP - INTERVAL '2 days'),

-- In Transit Deliveries
('SBN-100009-0009', 'in_transit', 'SBNC Pasay Branch', '445 Edsa Street, Pasay City', '84045609', 'Special order bolts and nuts', 48.3, CURRENT_DATE, 'high', 1, 9, 2, NULL, CURRENT_TIMESTAMP - INTERVAL '3 days'),
('SBN-100010-0010', 'in_transit', 'Lipa Branch User', 'Purok 1, Tambo, Lipa City, Batangas', '043-7742179', 'Monthly hardware supply', 55.1, CURRENT_DATE, 'medium', 3, 10, 3, NULL, CURRENT_TIMESTAMP - INTERVAL '2 days'),
('SBN-100011-0011', 'in_transit', 'Malvar Branch User', '553 J.P. Laurel Hi-Way, Malvar, Batangas', '043-7401027', 'Industrial fasteners', 61.7, CURRENT_DATE, 'medium', 5, 9, 3, NULL, CURRENT_TIMESTAMP - INTERVAL '3 days'),

-- Delivered Deliveries (with different delivery times for metrics)
('SBN-100012-0012', 'delivered', 'SBNC Pasay Branch', '445 Edsa Street, Pasay City', '84045609', 'Regular stock order', 43.6, CURRENT_TIMESTAMP - INTERVAL '21 days', 'medium', 1, 9, 2, 4, CURRENT_TIMESTAMP - INTERVAL '20 days'),
('SBN-100013-0013', 'delivered', 'SBNC Pasay Branch', '445 Edsa Street, Pasay City', '84045609', 'Regular stock order', 38.2, CURRENT_TIMESTAMP - INTERVAL '31 days', 'medium', 1, 10, 2, 5, CURRENT_TIMESTAMP - INTERVAL '30 days'),
('SBN-100014-0014', 'delivered', 'Sucat Branch User', '8145 Dra. Santos Avenue, Sucat, Paranaque', '8360199', 'Rush order completion', 51.4, CURRENT_TIMESTAMP - INTERVAL '16 days', 'high', 2, 9, 2, 8, CURRENT_TIMESTAMP - INTERVAL '15 days'),
('SBN-100015-0015', 'delivered', 'Sucat Branch User', '8145 Dra. Santos Avenue, Sucat, Paranaque', '8360199', 'Standard inventory items', 34.8, CURRENT_TIMESTAMP - INTERVAL '26 days', 'low', 2, 10, 2, 9, CURRENT_TIMESTAMP - INTERVAL '25 days'),
('SBN-100016-0016', 'delivered', 'Lipa Branch User', 'Purok 1, Tambo, Lipa City, Batangas', '043-7742179', 'Monthly order supplies', 47.2, CURRENT_TIMESTAMP - INTERVAL '21 days', 'medium', 3, 9, 3, 12, CURRENT_TIMESTAMP - INTERVAL '20 days'),
('SBN-100017-0017', 'delivered', 'QC Hardware User', '1165 B Quezon Avenue, Quezon City', '83324911', 'Standard hardware items', 36.5, CURRENT_TIMESTAMP - INTERVAL '13 days', 'medium', 4, 10, 2, 15, CURRENT_TIMESTAMP - INTERVAL '12 days'),
('SBN-100018-0018', 'delivered', 'QC Hardware User', '1165 B Quezon Avenue, Quezon City', '83324911', 'Emergency parts replacement', 29.8, CURRENT_TIMESTAMP - INTERVAL '19 days', 'high', 4, 9, 2, 16, CURRENT_TIMESTAMP - INTERVAL '18 days'),
('SBN-100019-0019', 'delivered', 'Malvar Branch User', '553 J.P. Laurel Hi-Way, Malvar, Batangas', '043-7401027', 'Non-urgent storage items', 41.3, CURRENT_TIMESTAMP - INTERVAL '16 days', 'low', 5, 10, 3, 19, CURRENT_TIMESTAMP - INTERVAL '15 days'),
('SBN-100020-0020', 'delivered', 'Malvar Branch User', '553 J.P. Laurel Hi-Way, Malvar, Batangas', '043-7401027', 'Regular monthly order', 53.7, CURRENT_TIMESTAMP - INTERVAL '23 days', 'medium', 5, 9, 3, 20, CURRENT_TIMESTAMP - INTERVAL '22 days'),

-- Additional recent deliveries for active branches
('SBN-100021-0021', 'delivered', 'SBNC Pasay Branch', '445 Edsa Street, Pasay City', '84045609', 'Special order hardware', 32.4, CURRENT_TIMESTAMP - INTERVAL '5 days', 'high', 1, 9, 2, NULL, CURRENT_TIMESTAMP - INTERVAL '7 days'),
('SBN-100022-0022', 'delivered', 'Sucat Branch User', '8145 Dra. Santos Avenue, Sucat, Paranaque', '8360199', 'Industrial quality tools', 45.6, CURRENT_TIMESTAMP - INTERVAL '4 days', 'medium', 2, 10, 2, NULL, CURRENT_TIMESTAMP - INTERVAL '6 days'),
('SBN-100023-0023', 'delivered', 'QC Hardware User', '1165 B Quezon Avenue, Quezon City', '83324911', 'Project-specific materials', 38.9, CURRENT_TIMESTAMP - INTERVAL '3 days', 'high', 4, 9, 2, NULL, CURRENT_TIMESTAMP - INTERVAL '5 days'),

-- Cancelled Deliveries
('SBN-100024-0024', 'cancelled', 'Lipa Branch User', 'Purok 1, Tambo, Lipa City, Batangas', '043-7742179', 'Order cancelled by customer', 27.5, CURRENT_TIMESTAMP - INTERVAL '10 days', 'low', 3, NULL, 3, NULL, CURRENT_TIMESTAMP - INTERVAL '12 days'),
('SBN-100025-0025', 'cancelled', 'Malvar Branch User', '553 J.P. Laurel Hi-Way, Malvar, Batangas', '043-7401027', 'Incorrect order details', 33.8, CURRENT_TIMESTAMP - INTERVAL '8 days', 'medium', 5, NULL, 3, NULL, CURRENT_TIMESTAMP - INTERVAL '9 days');

-- Update some deliveries to have received timestamps for completed deliveries
UPDATE deliveries SET 
    received_at = updated_at + INTERVAL '2 hours', 
    received_by = branch_id + 2  -- This assumes the branch user will receive it (matches branch_id in users table)
WHERE status = 'delivered';

-- Note: All passwords are 'password123' 