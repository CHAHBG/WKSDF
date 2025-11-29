-- Initialize Database Schema
-- Run this to create all necessary tables if they don't exist

BEGIN;

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 1. Shop Settings
CREATE TABLE IF NOT EXISTS shop_settings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    shop_name TEXT NOT NULL,
    location TEXT,
    phone_number TEXT,
    email TEXT,
    logo_url TEXT,
    owner_id UUID REFERENCES auth.users(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Users Profile
CREATE TABLE IF NOT EXISTS users_profile (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    shop_id UUID REFERENCES shop_settings(id) ON DELETE CASCADE,
    role TEXT NOT NULL CHECK (role IN ('owner', 'agent')),
    full_name TEXT,
    phone_number TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    created_by UUID REFERENCES auth.users(id)
);

-- 3. Categories
CREATE TABLE IF NOT EXISTS categories (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    shop_id UUID REFERENCES shop_settings(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Products
CREATE TABLE IF NOT EXISTS products (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    description TEXT,
    unit_price NUMERIC NOT NULL,
    quantity INTEGER DEFAULT 0,
    alert_threshold INTEGER DEFAULT 5,
    image_url TEXT,
    sku TEXT, -- Added SKU column
    category_id UUID REFERENCES categories(id) ON DELETE SET NULL,
    shop_id UUID REFERENCES shop_settings(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. Sales
CREATE TABLE IF NOT EXISTS sales (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    amount NUMERIC NOT NULL,
    items JSONB DEFAULT '[]'::jsonb,
    payment_method TEXT DEFAULT 'cash',
    customer_name TEXT,
    status TEXT DEFAULT 'COMPLETED',
    shop_id UUID REFERENCES shop_settings(id) ON DELETE CASCADE,
    created_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. Daily Closing Reports
CREATE TABLE IF NOT EXISTS daily_closing_reports (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    opening_cash NUMERIC DEFAULT 0,
    closing_cash NUMERIC DEFAULT 0,
    total_sales NUMERIC DEFAULT 0,
    discrepancy NUMERIC DEFAULT 0,
    notes TEXT,
    cash_denominations JSONB DEFAULT '{}'::jsonb,
    mobile_money_balances JSONB DEFAULT '{}'::jsonb,
    shop_id UUID REFERENCES shop_settings(id) ON DELETE CASCADE,
    created_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 7. Mobile Money Operations
CREATE TABLE IF NOT EXISTS mobile_money_operations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    provider TEXT NOT NULL, -- Orange Money, Wave, etc.
    type TEXT NOT NULL CHECK (type IN ('deposit', 'withdrawal')),
    amount NUMERIC NOT NULL,
    fee NUMERIC DEFAULT 0,
    customer_phone TEXT,
    transaction_id TEXT,
    shop_id UUID REFERENCES shop_settings(id) ON DELETE CASCADE,
    created_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 8. Transfers
CREATE TABLE IF NOT EXISTS transfers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    type TEXT NOT NULL, -- 'in' or 'out'
    amount NUMERIC NOT NULL,
    description TEXT,
    shop_id UUID REFERENCES shop_settings(id) ON DELETE CASCADE,
    created_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 9. Expenses
CREATE TABLE IF NOT EXISTS expenses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  shop_id UUID REFERENCES shop_settings(id),
  type TEXT NOT NULL CHECK (type = ANY (ARRAY['LOCATION'::text, 'WIFI'::text, 'SALARY'::text, 'DEPENSES'::text, 'COMMISSION'::text])),
  amount NUMERIC NOT NULL,
  description TEXT,
  expense_date DATE NOT NULL DEFAULT CURRENT_DATE
);

-- 10. Mobile Money Platforms
CREATE TABLE IF NOT EXISTS mm_platforms (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  code TEXT NOT NULL UNIQUE,
  color TEXT DEFAULT '#3B82F6',
  icon_url TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 11. Mobile Money Daily Reports
CREATE TABLE IF NOT EXISTS mm_daily_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  report_date DATE NOT NULL DEFAULT CURRENT_DATE,
  agent_id UUID REFERENCES auth.users(id),
  opening_balance NUMERIC DEFAULT 0,
  closing_balance NUMERIC,
  theoretical_balance NUMERIC DEFAULT 0,
  actual_balance NUMERIC,
  total_in NUMERIC DEFAULT 0,
  total_out NUMERIC DEFAULT 0,
  total_fees NUMERIC DEFAULT 0,
  transaction_count INTEGER DEFAULT 0,
  daily_discrepancy NUMERIC DEFAULT 0,
  cumulative_discrepancy NUMERIC DEFAULT 0,
  discrepancy_notes TEXT,
  is_closed BOOLEAN DEFAULT false,
  closed_at TIMESTAMPTZ,
  opened_at TIMESTAMPTZ DEFAULT now(),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 12. Mobile Money Transactions
CREATE TABLE IF NOT EXISTS mm_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  transaction_date TIMESTAMPTZ DEFAULT now(),
  platform_id UUID REFERENCES mm_platforms(id),
  agent_id UUID REFERENCES auth.users(id),
  daily_report_id UUID REFERENCES mm_daily_reports(id),
  operation_type TEXT NOT NULL CHECK (operation_type = ANY (ARRAY['ENCAISSEMENT'::text, 'DECAISSEMENT'::text])),
  amount NUMERIC NOT NULL CHECK (amount > 0),
  fees NUMERIC DEFAULT 0 CHECK (fees >= 0),
  total_amount NUMERIC NOT NULL CHECK (total_amount > 0),
  sender_name TEXT,
  sender_phone TEXT,
  recipient_name TEXT,
  recipient_phone TEXT,
  reference_number TEXT,
  status TEXT DEFAULT 'COMPLETED' CHECK (status = ANY (ARRAY['PENDING'::text, 'COMPLETED'::text, 'FAILED'::text, 'CANCELLED'::text])),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  synced_at TIMESTAMPTZ
);

-- 13. Mobile Money Cash Counts
CREATE TABLE IF NOT EXISTS mm_cash_counts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  daily_report_id UUID REFERENCES mm_daily_reports(id),
  count_date TIMESTAMPTZ DEFAULT now(),
  bills_10000 INTEGER DEFAULT 0,
  bills_5000 INTEGER DEFAULT 0,
  bills_2000 INTEGER DEFAULT 0,
  bills_1000 INTEGER DEFAULT 0,
  bills_500 INTEGER DEFAULT 0,
  coins_500 INTEGER DEFAULT 0,
  coins_250 INTEGER DEFAULT 0,
  coins_200 INTEGER DEFAULT 0,
  coins_100 INTEGER DEFAULT 0,
  coins_50 INTEGER DEFAULT 0,
  coins_25 INTEGER DEFAULT 0,
  total_bills NUMERIC,
  total_coins NUMERIC,
  total_amount NUMERIC,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Create Indexes
CREATE INDEX IF NOT EXISTS idx_users_profile_shop_id ON users_profile(shop_id);
CREATE INDEX IF NOT EXISTS idx_products_shop_id ON products(shop_id);
CREATE INDEX IF NOT EXISTS idx_sales_shop_id ON sales(shop_id);
CREATE INDEX IF NOT EXISTS idx_products_sku ON products(sku);

-- Enable RLS on all tables
ALTER TABLE shop_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE users_profile ENABLE ROW LEVEL SECURITY;
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE sales ENABLE ROW LEVEL SECURITY;
ALTER TABLE daily_closing_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE mobile_money_operations ENABLE ROW LEVEL SECURITY;
ALTER TABLE transfers ENABLE ROW LEVEL SECURITY;
ALTER TABLE expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE mm_platforms ENABLE ROW LEVEL SECURITY;
ALTER TABLE mm_daily_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE mm_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE mm_cash_counts ENABLE ROW LEVEL SECURITY;

COMMIT;
