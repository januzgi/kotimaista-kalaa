-- Create default_prices table
CREATE TABLE public.default_prices (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  fisherman_id UUID NOT NULL REFERENCES public.fisherman_profiles(id) ON DELETE CASCADE,
  species TEXT NOT NULL,
  form TEXT NOT NULL,
  price_per_kg NUMERIC NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  
  -- Unique constraint to prevent duplicates
  UNIQUE(fisherman_id, species, form)
);

-- Enable Row Level Security
ALTER TABLE public.default_prices ENABLE ROW LEVEL SECURITY;

-- Create policies for fishermen to manage their own default prices
CREATE POLICY "Fishermen can view their own default prices" 
ON public.default_prices 
FOR SELECT 
USING (fisherman_id IN (
  SELECT id FROM public.fisherman_profiles WHERE user_id = auth.uid()
));

CREATE POLICY "Fishermen can create their own default prices" 
ON public.default_prices 
FOR INSERT 
WITH CHECK (fisherman_id IN (
  SELECT id FROM public.fisherman_profiles WHERE user_id = auth.uid()
));

CREATE POLICY "Fishermen can update their own default prices" 
ON public.default_prices 
FOR UPDATE 
USING (fisherman_id IN (
  SELECT id FROM public.fisherman_profiles WHERE user_id = auth.uid()
));

CREATE POLICY "Fishermen can delete their own default prices" 
ON public.default_prices 
FOR DELETE 
USING (fisherman_id IN (
  SELECT id FROM public.fisherman_profiles WHERE user_id = auth.uid()
));

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_default_prices_updated_at
BEFORE UPDATE ON public.default_prices
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();