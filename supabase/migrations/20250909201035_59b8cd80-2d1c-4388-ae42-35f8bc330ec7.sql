-- First, update any existing orders with COMPLETED status to CONFIRMED status
UPDATE orders SET status = 'CONFIRMED' WHERE status = 'COMPLETED';

-- Create a new ENUM type without the COMPLETED value
CREATE TYPE order_status_new AS ENUM ('NEW', 'CONFIRMED', 'CANCELLED');

-- Update the orders table to use the new ENUM type
ALTER TABLE orders 
ALTER COLUMN status TYPE order_status_new 
USING status::text::order_status_new;

-- Update the default value to use the new type
ALTER TABLE orders 
ALTER COLUMN status SET DEFAULT 'NEW'::order_status_new;

-- Drop the old ENUM type
DROP TYPE order_status;

-- Rename the new ENUM type to the original name
ALTER TYPE order_status_new RENAME TO order_status;