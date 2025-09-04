-- Add display_on_homepage column to fisherman_profiles table
ALTER TABLE public.fisherman_profiles 
ADD COLUMN display_on_homepage BOOLEAN NOT NULL DEFAULT false;