-- Create enum for user roles
CREATE TYPE public.user_role AS ENUM ('ADMIN', 'CUSTOMER');

-- Create enum for fulfillment types
CREATE TYPE public.fulfillment_type AS ENUM ('PICKUP', 'DELIVERY');

-- Create enum for order status
CREATE TYPE public.order_status AS ENUM ('NEW', 'CONFIRMED', 'COMPLETED', 'CANCELLED');

-- Create Users table (extends auth.users)
CREATE TABLE public.users (
  id UUID NOT NULL PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  full_name TEXT,
  avatar_url TEXT,
  phone_number TEXT,
  role user_role NOT NULL DEFAULT 'CUSTOMER',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Create Fisherman_Profiles table
CREATE TABLE public.fisherman_profiles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  public_phone_number TEXT,
  signature_image_url TEXT,
  pickup_address TEXT NOT NULL,
  default_delivery_fee NUMERIC(10,2) NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Create Products table
CREATE TABLE public.products (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  fisherman_id UUID NOT NULL REFERENCES public.fisherman_profiles(id) ON DELETE CASCADE,
  species TEXT NOT NULL,
  form TEXT NOT NULL,
  price_per_kg NUMERIC(10,2) NOT NULL,
  available_quantity NUMERIC(10,2) NOT NULL DEFAULT 0,
  catch_date TIMESTAMP WITH TIME ZONE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Create Fulfillment_Slots table
CREATE TABLE public.fulfillment_slots (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  fisherman_id UUID NOT NULL REFERENCES public.fisherman_profiles(id) ON DELETE CASCADE,
  start_time TIMESTAMP WITH TIME ZONE NOT NULL,
  end_time TIMESTAMP WITH TIME ZONE NOT NULL,
  type fulfillment_type NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Create Orders table
CREATE TABLE public.orders (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  customer_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  customer_name TEXT NOT NULL,
  customer_address TEXT,
  customer_phone TEXT NOT NULL,
  fulfillment_type fulfillment_type NOT NULL,
  fulfillment_slot_id UUID NOT NULL REFERENCES public.fulfillment_slots(id),
  final_delivery_fee NUMERIC(10,2) DEFAULT 0,
  status order_status NOT NULL DEFAULT 'NEW',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Create Order_Items table
CREATE TABLE public.order_items (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  quantity NUMERIC(10,2) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Create Email_Subscriptions table
CREATE TABLE public.email_subscriptions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  email TEXT NOT NULL UNIQUE,
  subscribed_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.fisherman_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.fulfillment_slots ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.email_subscriptions ENABLE ROW LEVEL SECURITY;

-- RLS Policies for users table
CREATE POLICY "Users can view their own profile" 
ON public.users 
FOR SELECT 
USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile" 
ON public.users 
FOR UPDATE 
USING (auth.uid() = id);

-- RLS Policies for fisherman_profiles table
CREATE POLICY "Fisherman profiles are viewable by everyone" 
ON public.fisherman_profiles 
FOR SELECT 
USING (true);

CREATE POLICY "Fishermen can manage their own profile" 
ON public.fisherman_profiles 
FOR ALL 
USING (auth.uid() = user_id);

-- RLS Policies for products table
CREATE POLICY "Products are viewable by everyone" 
ON public.products 
FOR SELECT 
USING (true);

CREATE POLICY "Fishermen can manage their own products" 
ON public.products 
FOR ALL 
USING (
  fisherman_id IN (
    SELECT id FROM public.fisherman_profiles 
    WHERE user_id = auth.uid()
  )
);

-- RLS Policies for fulfillment_slots table
CREATE POLICY "Fulfillment slots are viewable by everyone" 
ON public.fulfillment_slots 
FOR SELECT 
USING (true);

CREATE POLICY "Fishermen can manage their own fulfillment slots" 
ON public.fulfillment_slots 
FOR ALL 
USING (
  fisherman_id IN (
    SELECT id FROM public.fisherman_profiles 
    WHERE user_id = auth.uid()
  )
);

-- RLS Policies for orders table
CREATE POLICY "Users can view their own orders" 
ON public.orders 
FOR SELECT 
USING (auth.uid() = customer_id);

CREATE POLICY "Users can create their own orders" 
ON public.orders 
FOR INSERT 
WITH CHECK (auth.uid() = customer_id);

CREATE POLICY "Users can update their own orders" 
ON public.orders 
FOR UPDATE 
USING (auth.uid() = customer_id);

CREATE POLICY "Fishermen can view orders for their products" 
ON public.orders 
FOR SELECT 
USING (
  fulfillment_slot_id IN (
    SELECT fs.id FROM public.fulfillment_slots fs
    JOIN public.fisherman_profiles fp ON fs.fisherman_id = fp.id
    WHERE fp.user_id = auth.uid()
  )
);

CREATE POLICY "Fishermen can update orders for their products" 
ON public.orders 
FOR UPDATE 
USING (
  fulfillment_slot_id IN (
    SELECT fs.id FROM public.fulfillment_slots fs
    JOIN public.fisherman_profiles fp ON fs.fisherman_id = fp.id
    WHERE fp.user_id = auth.uid()
  )
);

-- RLS Policies for order_items table
CREATE POLICY "Order items are viewable by order owner" 
ON public.order_items 
FOR SELECT 
USING (
  order_id IN (
    SELECT id FROM public.orders 
    WHERE customer_id = auth.uid()
  )
);

CREATE POLICY "Order items can be created by order owner" 
ON public.order_items 
FOR INSERT 
WITH CHECK (
  order_id IN (
    SELECT id FROM public.orders 
    WHERE customer_id = auth.uid()
  )
);

CREATE POLICY "Fishermen can view order items for their products" 
ON public.order_items 
FOR SELECT 
USING (
  order_id IN (
    SELECT o.id FROM public.orders o
    JOIN public.fulfillment_slots fs ON o.fulfillment_slot_id = fs.id
    JOIN public.fisherman_profiles fp ON fs.fisherman_id = fp.id
    WHERE fp.user_id = auth.uid()
  )
);

-- RLS Policies for email_subscriptions table
CREATE POLICY "Email subscriptions are publicly insertable" 
ON public.email_subscriptions 
FOR INSERT 
WITH CHECK (true);

-- Create trigger function to update timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for updated_at
CREATE TRIGGER update_users_updated_at
  BEFORE UPDATE ON public.users
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_fisherman_profiles_updated_at
  BEFORE UPDATE ON public.fisherman_profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_products_updated_at
  BEFORE UPDATE ON public.products
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_orders_updated_at
  BEFORE UPDATE ON public.orders
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Function to handle new user creation
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users (id, email, full_name, avatar_url, role)
  VALUES (
    NEW.id,
    NEW.email,
    NEW.raw_user_meta_data->>'full_name',
    NEW.raw_user_meta_data->>'avatar_url',
    'CUSTOMER'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Trigger to create user profile when auth user is created
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();