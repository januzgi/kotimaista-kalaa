-- Create RPC function to get new order count for the currently logged-in fisherman
CREATE OR REPLACE FUNCTION public.get_new_order_count()
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  new_count integer;
BEGIN
  -- Get the count of NEW orders for the current fisherman
  SELECT COUNT(*)::integer INTO new_count
  FROM orders o
  JOIN fulfillment_slots fs ON o.fulfillment_slot_id = fs.id
  JOIN fisherman_profiles fp ON fs.fisherman_id = fp.id
  WHERE fp.user_id = auth.uid()
    AND o.status = 'NEW';
    
  RETURN COALESCE(new_count, 0);
END;
$$;