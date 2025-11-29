-- Clear all existing data and schema for fresh start
-- WARNING: This will delete ALL data and tables in your database

BEGIN;

-- Drop tables with CASCADE to handle dependencies
-- This ensures we remove the old schema completely so init_database.sql can recreate it correctly
DROP TABLE IF EXISTS transfers CASCADE;
DROP TABLE IF EXISTS mobile_money_operations CASCADE;
DROP TABLE IF EXISTS daily_closing_reports CASCADE;
DROP TABLE IF EXISTS sales CASCADE;
DROP TABLE IF EXISTS products CASCADE;
DROP TABLE IF EXISTS categories CASCADE;
DROP TABLE IF EXISTS users_profile CASCADE;
DROP TABLE IF EXISTS shop_settings CASCADE;

-- Delete all auth users (reset authentication)
DELETE FROM auth.users;

COMMIT;
