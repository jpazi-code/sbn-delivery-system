-- Add delivery_id column to delivery_requests table
ALTER TABLE delivery_requests
ADD COLUMN IF NOT EXISTS delivery_id INTEGER REFERENCES deliveries(id) ON DELETE SET NULL;

-- Create an index for better lookup performance
CREATE INDEX IF NOT EXISTS idx_delivery_requests_delivery_id ON delivery_requests(delivery_id);

-- Add function to ensure delivery_id and request_id reference each other
CREATE OR REPLACE FUNCTION update_delivery_request_relationship()
RETURNS TRIGGER AS $$
BEGIN
    -- When a delivery is created with a request_id
    IF (TG_OP = 'INSERT' OR TG_OP = 'UPDATE') AND NEW.request_id IS NOT NULL THEN
        -- Update the delivery_id in the delivery_requests table
        UPDATE delivery_requests
        SET delivery_id = NEW.id
        WHERE id = NEW.request_id;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger on deliveries table
DROP TRIGGER IF EXISTS delivery_request_relationship_trigger ON deliveries;
CREATE TRIGGER delivery_request_relationship_trigger
AFTER INSERT OR UPDATE ON deliveries
FOR EACH ROW
EXECUTE FUNCTION update_delivery_request_relationship();

-- Update existing relationships
UPDATE delivery_requests dr
SET delivery_id = d.id
FROM deliveries d
WHERE dr.id = d.request_id AND d.request_id IS NOT NULL; 