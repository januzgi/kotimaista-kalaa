-- Fix the search path issue by setting it in the function
CREATE OR REPLACE FUNCTION public.get_catch_groups(fisherman_profile_id uuid)
RETURNS TABLE (
  catch_date date,
  products jsonb,
  fulfillment_slots jsonb
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  RETURN QUERY
  WITH product_days AS (
    SELECT
      (p.catch_date AT TIME ZONE 'Europe/Helsinki')::date AS day,
      p.id,
      p.species,
      p.form,
      p.price_per_kg,
      p.available_quantity,
      p.catch_date,
      p.created_at
    FROM public.products p
    WHERE p.fisherman_id = fisherman_profile_id
  ),
  slot_days AS (
    SELECT
      (fs.start_time AT TIME ZONE 'Europe/Helsinki')::date AS day,
      fs.id,
      fs.start_time,
      fs.end_time,
      fs.type
    FROM public.fulfillment_slots fs
    WHERE fs.fisherman_id = fisherman_profile_id
  ),
  distinct_days AS (
    SELECT day FROM product_days
    UNION
    SELECT day FROM slot_days
  )
  SELECT
    d.day AS catch_date,
    COALESCE(
      (
        SELECT jsonb_agg(to_jsonb(p) ORDER BY p.catch_date DESC)
        FROM product_days p
        WHERE p.day = d.day
      ), '[]'::jsonb
    ) AS products,
    COALESCE(
      (
        SELECT jsonb_agg(to_jsonb(fs) ORDER BY fs.start_time ASC)
        FROM slot_days fs
        WHERE fs.day = d.day
      ), '[]'::jsonb
    ) AS fulfillment_slots
  FROM distinct_days d
  ORDER BY d.day DESC;
END;
$$;