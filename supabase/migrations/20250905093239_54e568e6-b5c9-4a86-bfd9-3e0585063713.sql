-- Create catches table
CREATE TABLE public.catches (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  fisherman_id UUID NOT NULL,
  catch_date DATE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on catches table
ALTER TABLE public.catches ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for catches table
CREATE POLICY "Fishermen can manage their own catches" 
ON public.catches 
FOR ALL 
USING (fisherman_id IN (
  SELECT fisherman_profiles.id
  FROM fisherman_profiles
  WHERE fisherman_profiles.user_id = auth.uid()
));

CREATE POLICY "Catches are viewable by everyone" 
ON public.catches 
FOR SELECT 
USING (true);

-- Add catch_id to products table
ALTER TABLE public.products ADD COLUMN catch_id UUID;

-- Add catch_id to fulfillment_slots table
ALTER TABLE public.fulfillment_slots ADD COLUMN catch_id UUID;

-- Migrate existing data: Create catches from existing products
INSERT INTO public.catches (fisherman_id, catch_date)
SELECT DISTINCT 
  p.fisherman_id, 
  (p.catch_date AT TIME ZONE 'Europe/Helsinki')::date
FROM public.products p
ORDER BY p.fisherman_id, (p.catch_date AT TIME ZONE 'Europe/Helsinki')::date;

-- Update products with catch_id
UPDATE public.products 
SET catch_id = c.id
FROM public.catches c
WHERE products.fisherman_id = c.fisherman_id
  AND (products.catch_date AT TIME ZONE 'Europe/Helsinki')::date = c.catch_date;

-- Update fulfillment_slots with catch_id
UPDATE public.fulfillment_slots 
SET catch_id = c.id
FROM public.catches c
WHERE fulfillment_slots.fisherman_id = c.fisherman_id
  AND (fulfillment_slots.start_time AT TIME ZONE 'Europe/Helsinki')::date = c.catch_date;

-- Make catch_id NOT NULL after migration
ALTER TABLE public.products ALTER COLUMN catch_id SET NOT NULL;
ALTER TABLE public.fulfillment_slots ALTER COLUMN catch_id SET NOT NULL;

-- Add foreign key constraints
ALTER TABLE public.products ADD CONSTRAINT products_catch_id_fkey 
FOREIGN KEY (catch_id) REFERENCES public.catches(id) ON DELETE CASCADE;

ALTER TABLE public.fulfillment_slots ADD CONSTRAINT fulfillment_slots_catch_id_fkey 
FOREIGN KEY (catch_id) REFERENCES public.catches(id) ON DELETE CASCADE;

-- Remove catch_date from products table (no longer needed)
ALTER TABLE public.products DROP COLUMN catch_date;

-- Add trigger for updated_at on catches
CREATE TRIGGER update_catches_updated_at
  BEFORE UPDATE ON public.catches
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Recreate the get_catch_groups function with new schema
CREATE OR REPLACE FUNCTION public.get_catch_groups(fisherman_profile_id uuid)
RETURNS TABLE(catch_date date, products jsonb, fulfillment_slots jsonb)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  RETURN QUERY
  SELECT
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
  ORDER BY c.catch_date DESC;
END;
$function$;