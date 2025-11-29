-- Multi-Tenancy Database Schema Migration
-- Run this in Supabase SQL Editor

-- ============================================
-- Step 0: Helper Functions (SECURITY DEFINER to avoid RLS recursion)
-- ============================================

CREATE OR REPLACE FUNCTION get_user_shop_id()
RETURNS UUID AS $$
BEGIN
  RETURN (SELECT shop_id FROM users_profile WHERE id = auth.uid() LIMIT 1);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION is_shop_owner()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM users_profile 
    WHERE id = auth.uid() AND role = 'owner'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- Step 1: Create users_profile table
-- ============================================
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

-- Add index for faster queries
CREATE INDEX IF NOT EXISTS idx_users_profile_shop_id ON users_profile(shop_id);
CREATE INDEX IF NOT EXISTS idx_users_profile_role ON users_profile(role);

-- ============================================
-- Step 2: Update shop_settings table
-- ============================================
ALTER TABLE shop_settings 
  ADD COLUMN IF NOT EXISTS owner_id UUID REFERENCES auth.users(id),
  ADD COLUMN IF NOT EXISTS id UUID DEFAULT gen_random_uuid() PRIMARY KEY;

-- ============================================
-- Step 3: Add shop_id to all existing tables
-- ============================================

-- Products
ALTER TABLE products ADD COLUMN IF NOT EXISTS shop_id UUID REFERENCES shop_settings(id) ON DELETE CASCADE;
CREATE INDEX IF NOT EXISTS idx_products_shop_id ON products(shop_id);

-- Categories  
ALTER TABLE categories ADD COLUMN IF NOT EXISTS shop_id UUID REFERENCES shop_settings(id) ON DELETE CASCADE;
CREATE INDEX IF NOT EXISTS idx_categories_shop_id ON categories(shop_id);

-- Sales
ALTER TABLE sales ADD COLUMN IF NOT EXISTS shop_id UUID REFERENCES shop_settings(id) ON DELETE CASCADE;
CREATE INDEX IF NOT EXISTS idx_sales_shop_id ON sales(shop_id);

-- Daily Closing Reports
ALTER TABLE daily_closing_reports ADD COLUMN IF NOT EXISTS shop_id UUID REFERENCES shop_settings(id) ON DELETE CASCADE;
CREATE INDEX IF NOT EXISTS idx_daily_closing_reports_shop_id ON daily_closing_reports(shop_id);

-- Mobile Money Operations
ALTER TABLE mobile_money_operations ADD COLUMN IF NOT EXISTS shop_id UUID REFERENCES shop_settings(id) ON DELETE CASCADE;
CREATE INDEX IF NOT EXISTS idx_mobile_money_operations_shop_id ON mobile_money_operations(shop_id);

-- Transfers  
ALTER TABLE transfers ADD COLUMN IF NOT EXISTS shop_id UUID REFERENCES shop_settings(id) ON DELETE CASCADE;
CREATE INDEX IF NOT EXISTS idx_transfers_shop_id ON transfers(shop_id);

-- ============================================
-- Step 4: Enable Row Level Security
-- ============================================

ALTER TABLE users_profile ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE sales ENABLE ROW LEVEL SECURITY;
ALTER TABLE daily_closing_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE mobile_money_operations ENABLE ROW LEVEL SECURITY;
ALTER TABLE transfers ENABLE ROW LEVEL SECURITY;

-- ============================================
-- Step 5: Create RLS Policies for users_profile
-- ============================================

DROP POLICY IF EXISTS "Users can view own profile" ON users_profile;
CREATE POLICY "Users can view own profile" ON users_profile
  FOR SELECT USING (id = auth.uid());

DROP POLICY IF EXISTS "Owners view shop agents" ON users_profile;
CREATE POLICY "Owners view shop agents" ON users_profile
  FOR SELECT USING (
    is_shop_owner() AND shop_id = get_user_shop_id()
  );

-- Allow users to create their own owner profile during shop setup
DROP POLICY IF EXISTS "Users create own owner profile" ON users_profile;
CREATE POLICY "Users create own owner profile" ON users_profile
  FOR INSERT WITH CHECK (
    id = auth.uid() AND role = 'owner'
  );

DROP POLICY IF EXISTS "Owners create agents" ON users_profile;
CREATE POLICY "Owners create agents" ON users_profile
  FOR INSERT WITH CHECK (
    role = 'agent' AND
    is_shop_owner() AND
    shop_id = get_user_shop_id()
  );

DROP POLICY IF EXISTS "Owners update agents" ON users_profile;
CREATE POLICY "Owners update agents" ON users_profile
  FOR UPDATE USING (
    is_shop_owner() AND shop_id = get_user_shop_id()
  );

-- ============================================
-- Step 6: Create RLS Policies for Products
-- ============================================

DROP POLICY IF EXISTS "Users view own shop products" ON products;
CREATE POLICY "Users view own shop products" ON products
  FOR SELECT USING (
    shop_id = get_user_shop_id()
  );

DROP POLICY IF EXISTS "Users insert products" ON products;
CREATE POLICY "Users insert products" ON products
  FOR INSERT WITH CHECK (
    shop_id = get_user_shop_id()
  );

DROP POLICY IF EXISTS "Owners update products" ON products;
CREATE POLICY "Owners update products" ON products
  FOR UPDATE USING (
    shop_id = get_user_shop_id() AND is_shop_owner()
  );

DROP POLICY IF EXISTS "Owners delete products" ON products;
CREATE POLICY "Owners delete products" ON products
  FOR DELETE USING (
    shop_id = get_user_shop_id() AND is_shop_owner()
  );

-- ============================================
-- Step 7: Create RLS Policies for Categories
-- ============================================

DROP POLICY IF EXISTS "Users view own shop categories" ON categories;
CREATE POLICY "Users view own shop categories" ON categories
  FOR SELECT USING (
    shop_id = get_user_shop_id()
  );

DROP POLICY IF EXISTS "Users insert categories" ON categories;
CREATE POLICY "Users insert categories" ON categories
  FOR INSERT WITH CHECK (
    shop_id = get_user_shop_id()
  );

DROP POLICY IF EXISTS "Owners update categories" ON categories;
CREATE POLICY "Owners update categories" ON categories
  FOR UPDATE USING (
    shop_id = get_user_shop_id() AND is_shop_owner()
  );

DROP POLICY IF EXISTS "Owners delete categories" ON categories;
CREATE POLICY "Owners delete categories" ON categories
  FOR DELETE USING (
    shop_id = get_user_shop_id() AND is_shop_owner()
  );

-- ============================================
-- Step 8: Create RLS Policies for Sales
-- ============================================

DROP POLICY IF EXISTS "Users view own shop sales" ON sales;
CREATE POLICY "Users view own shop sales" ON sales
  FOR SELECT USING (
    shop_id = get_user_shop_id()
  );

DROP POLICY IF EXISTS "Users insert sales" ON sales;
CREATE POLICY "Users insert sales" ON sales
  FOR INSERT WITH CHECK (
    shop_id = get_user_shop_id()
  );

DROP POLICY IF EXISTS "Owners delete sales" ON sales;
CREATE POLICY "Owners delete sales" ON sales
  FOR DELETE USING (
    shop_id = get_user_shop_id() AND is_shop_owner()
  );

-- ============================================
-- Step 9: Create RLS Policies for Reports
-- ============================================

DROP POLICY IF EXISTS "Users view own shop reports" ON daily_closing_reports;
CREATE POLICY "Users view own shop reports" ON daily_closing_reports
  FOR SELECT USING (
    shop_id = get_user_shop_id()
  );

DROP POLICY IF EXISTS "Users insert reports" ON daily_closing_reports;
CREATE POLICY "Users insert reports" ON daily_closing_reports
  FOR INSERT WITH CHECK (
    shop_id = get_user_shop_id()
  );

-- ============================================
-- Step 10: Create RLS Policies for Mobile Money
-- ============================================

DROP POLICY IF EXISTS "Users view own shop mobile money" ON mobile_money_operations;
CREATE POLICY "Users view own shop mobile money" ON mobile_money_operations
  FOR SELECT USING (
    shop_id = get_user_shop_id()
  );

DROP POLICY IF EXISTS "Users insert mobile money" ON mobile_money_operations;
CREATE POLICY "Users insert mobile money" ON mobile_money_operations
  FOR INSERT WITH CHECK (
    shop_id = get_user_shop_id()
  );

-- ============================================
-- Step 11: Create RLS Policies for Transfers
-- ============================================

DROP POLICY IF EXISTS "Users view own shop transfers" ON transfers;
CREATE POLICY "Users view own shop transfers" ON transfers
  FOR SELECT USING (
    shop_id = get_user_shop_id()
  );

DROP POLICY IF EXISTS "Users insert transfers" ON transfers;
CREATE POLICY "Users insert transfers" ON transfers
  FOR INSERT WITH CHECK (
    shop_id = get_user_shop_id()
  );

-- ============================================
-- Step 12: Enable RLS and Create Policies for shop_settings
-- ============================================

ALTER TABLE shop_settings ENABLE ROW LEVEL SECURITY;

-- Allow any authenticated user to create their first shop
DROP POLICY IF EXISTS "Users can create shop" ON shop_settings;
CREATE POLICY "Users can create shop" ON shop_settings
  FOR INSERT WITH CHECK (
    auth.uid() = owner_id
  );

-- Users can view their own shop settings
DROP POLICY IF EXISTS "Users view own shop" ON shop_settings;
CREATE POLICY "Users view own shop" ON shop_settings
  FOR SELECT USING (
    auth.uid() = owner_id OR 
    id IN (SELECT shop_id FROM users_profile WHERE id = auth.uid())
  );

-- Only owners can update their shop settings
DROP POLICY IF EXISTS "Owners update shop" ON shop_settings;
CREATE POLICY "Owners update shop" ON shop_settings
  FOR UPDATE USING (
    auth.uid() = owner_id
  );
