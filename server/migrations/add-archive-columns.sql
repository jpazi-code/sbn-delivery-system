-- Add archive-related columns to deliveries table
ALTER TABLE deliveries
ADD COLUMN IF NOT EXISTS cancel_reason TEXT,
ADD COLUMN IF NOT EXISTS is_archived BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS archived_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS archived_at TIMESTAMP;

-- Add archive-related columns to delivery_requests table
ALTER TABLE delivery_requests
ADD COLUMN IF NOT EXISTS is_archived BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS archived_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS archived_at TIMESTAMP;

-- Create indexes for performance on archive queries
CREATE INDEX IF NOT EXISTS idx_deliveries_is_archived ON deliveries(is_archived);
CREATE INDEX IF NOT EXISTS idx_deliveries_status ON deliveries(status);

CREATE INDEX IF NOT EXISTS idx_delivery_requests_is_archived ON delivery_requests(is_archived);
CREATE INDEX IF NOT EXISTS idx_delivery_requests_status ON delivery_requests(request_status);

-- Set all completed deliveries to archived status
UPDATE deliveries
SET 
  is_archived = TRUE,
  archived_at = created_at
WHERE status IN ('delivered', 'cancelled') AND is_archived IS NULL;

-- Set all completed delivery requests to archived status
UPDATE delivery_requests
SET 
  is_archived = TRUE,
  archived_at = created_at
WHERE request_status IN ('delivered', 'cancelled', 'rejected') AND is_archived IS NULL; 