-- Create planned_trips table for fisherman scheduling
CREATE TABLE public.planned_trips (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  fisherman_id UUID NOT NULL,
  trip_date DATE NOT NULL,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Add unique constraint on fisherman_id and trip_date combination
ALTER TABLE public.planned_trips 
ADD CONSTRAINT unique_fisherman_trip_date UNIQUE (fisherman_id, trip_date);

-- Add foreign key reference to fisherman_profiles
ALTER TABLE public.planned_trips 
ADD CONSTRAINT fk_planned_trips_fisherman 
FOREIGN KEY (fisherman_id) REFERENCES public.fisherman_profiles(id) ON DELETE CASCADE;

-- Enable Row Level Security
ALTER TABLE public.planned_trips ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for fishermen to manage their own planned trips
CREATE POLICY "Fishermen can view their own planned trips" 
ON public.planned_trips 
FOR SELECT 
USING (fisherman_id IN (
  SELECT fisherman_profiles.id
  FROM fisherman_profiles
  WHERE fisherman_profiles.user_id = auth.uid()
));

CREATE POLICY "Fishermen can create their own planned trips" 
ON public.planned_trips 
FOR INSERT 
WITH CHECK (fisherman_id IN (
  SELECT fisherman_profiles.id
  FROM fisherman_profiles
  WHERE fisherman_profiles.user_id = auth.uid()
));

CREATE POLICY "Fishermen can update their own planned trips" 
ON public.planned_trips 
FOR UPDATE 
USING (fisherman_id IN (
  SELECT fisherman_profiles.id
  FROM fisherman_profiles
  WHERE fisherman_profiles.user_id = auth.uid()
));

CREATE POLICY "Fishermen can delete their own planned trips" 
ON public.planned_trips 
FOR DELETE 
USING (fisherman_id IN (
  SELECT fisherman_profiles.id
  FROM fisherman_profiles
  WHERE fisherman_profiles.user_id = auth.uid()
));

-- Allow public to view planned trips for the public calendar
CREATE POLICY "Planned trips are viewable by everyone" 
ON public.planned_trips 
FOR SELECT 
USING (true);

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_planned_trips_updated_at
BEFORE UPDATE ON public.planned_trips
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();