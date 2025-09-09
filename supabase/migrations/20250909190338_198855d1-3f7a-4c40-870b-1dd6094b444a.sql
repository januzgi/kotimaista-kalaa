-- Update get_catch_groups function to return catch_id for unique keys
CREATE OR REPLACE FUNCTION public.get_catch_groups(fisherman_profile_id uuid)
RETURNS TABLE(catch_id uuid, catch_date date, products jsonb, fulfillment_slots jsonb)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  RETURN QUERY
  SELECT
    c.id AS catch_id,
    c.catch_date,
    COALESCE(
      (
        SELECT jsonb_agg(
          jsonb_build_object(
            'id', p.id,
            'species', p.species,
            'form', p.form,
            'price_per_kg', p.price_per_kg,
            'available_quantity', p.available_quantity,
            'created_at', p.created_at
          ) ORDER BY p.created_at DESC
        )
        FROM public.products p
        WHERE p.catch_id = c.id
      ), '[]'::jsonb
    ) AS products,
    COALESCE(
      (
        SELECT jsonb_agg(
          jsonb_build_object(
            'id', fs.id,
            'start_time', fs.start_time,
            'end_time', fs.end_time,
            'type', fs.type
          ) ORDER BY fs.start_time ASC
        )
        FROM public.fulfillment_slots fs
        WHERE fs.catch_id = c.id
      ), '[]'::jsonb
    ) AS fulfillment_slots
  FROM public.catches c
  WHERE c.fisherman_id = fisherman_profile_id
  ORDER BY c.catch_date DESC, c.created_at DESC;
END;
$function$;