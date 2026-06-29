-- ENABLE UUID EXTENSION
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. CAR_USERS TABLE (Replaces Supabase Auth)
CREATE TABLE public.car_users (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  full_name TEXT,
  phone TEXT,
  avatar_url TEXT,
  role TEXT DEFAULT 'user' CHECK (role IN ('user', 'admin')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. CARS TABLE
CREATE TABLE public.cars (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  name TEXT NOT NULL,
  brand TEXT NOT NULL,
  description TEXT,
  per_day_cost NUMERIC(10,2) NOT NULL,
  extra_km_cost NUMERIC(10,2) NOT NULL,
  images TEXT[],
  features TEXT[],
  status TEXT DEFAULT 'available' CHECK (status IN ('available', 'maintenance', 'rented')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. CAR_BOOKINGS TABLE
CREATE TABLE public.car_bookings (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES public.car_users(id) ON DELETE CASCADE,
  car_id UUID REFERENCES public.cars(id) ON DELETE CASCADE,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  total_days INTEGER NOT NULL,
  expected_kms INTEGER DEFAULT 0,
  total_price NUMERIC(10,2) NOT NULL,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'completed', 'cancelled')),
  payment_status TEXT DEFAULT 'unpaid' CHECK (payment_status IN ('unpaid', 'paid', 'refunded')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. CAR_NOTIFICATIONS TABLE
CREATE TABLE public.car_notifications (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES public.car_users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  body TEXT NOT NULL,
  is_read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- IMPORTANT: Since we are not using Supabase Auth (auth.users), RLS is effectively disabled.
-- We are explicitly allowing all operations on these tables for the custom Auth flow.
ALTER TABLE public.car_users DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.cars DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.car_bookings DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.car_notifications DISABLE ROW LEVEL SECURITY;
