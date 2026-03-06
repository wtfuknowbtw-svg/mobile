-- ApnaKhata Supabase Schema Setup
-- Run this in the Supabase SQL Editor: https://supabase.com/dashboard/project/vchknshhzyikwlmstquf/sql/new

-- Create businesses table
CREATE TABLE IF NOT EXISTS businesses (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  phone TEXT UNIQUE NOT NULL,
  name TEXT,
  type TEXT,
  language TEXT DEFAULT 'hi',
  gstin TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create customers table
CREATE TABLE IF NOT EXISTS customers (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  business_id UUID REFERENCES businesses(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  phone TEXT,
  total_udhar REAL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create transactions table
CREATE TABLE IF NOT EXISTS transactions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  business_id UUID REFERENCES businesses(id) ON DELETE CASCADE,
  customer_id UUID REFERENCES customers(id) ON DELETE SET NULL,
  customer_name TEXT,
  item_name TEXT,
  quantity REAL,
  unit TEXT,
  price REAL NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('credit', 'cash', 'expense', 'unknown')),
  date TIMESTAMPTZ DEFAULT NOW(),
  ai_confidence REAL,
  source_type TEXT CHECK (source_type IN ('ocr', 'voice', 'manual', 'whatsapp')),
  source_image_url TEXT,
  raw_text TEXT,
  is_confirmed BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE businesses ENABLE ROW LEVEL SECURITY;
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;

-- Permissive policies for development (allow all access via anon key)
CREATE POLICY "anon_all_businesses" ON businesses FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "anon_all_customers" ON customers FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "anon_all_transactions" ON transactions FOR ALL USING (true) WITH CHECK (true);
