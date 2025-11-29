-- Add sku column to products table
ALTER TABLE products ADD COLUMN IF NOT EXISTS sku TEXT;
CREATE INDEX IF NOT EXISTS idx_products_sku ON products(sku);
