-- Create inventory view with avoir (stock adjustments)
-- This view combines products with their stock levels

DROP VIEW IF EXISTS v_inventory_with_avoir;

CREATE OR REPLACE VIEW v_inventory_with_avoir AS
SELECT 
    p.id,
    p.name,
    p.category_id,
    p.unit_price, -- Keep original name
    p.unit_price as selling_price, -- Keep alias for backward compatibility if needed
    p.quantity,
    p.alert_threshold as min_stock_level,
    p.image_url, -- Added image_url
    p.sku, -- Added sku
    p.shop_id,
    p.created_at,
    p.updated_at,
    c.name as category_name,
    (p.quantity * p.unit_price) as real_money,
    0 as avoir
FROM products p
LEFT JOIN categories c ON p.category_id = c.id;
