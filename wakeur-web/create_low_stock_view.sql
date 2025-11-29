-- Create low stock alerts view
-- This view identifies products with stock below their minimum threshold

DROP VIEW IF EXISTS public.v_low_stock_alerts;

CREATE VIEW public.v_low_stock_alerts AS
SELECT 
    p.id,
    p.name,
    p.quantity as current_stock,
    p.alert_threshold as min_stock_level,
    p.shop_id,
    (p.alert_threshold - p.quantity) as stock_deficit
FROM 
    public.products p
WHERE 
    p.quantity < p.alert_threshold
ORDER BY 
    (p.alert_threshold - p.quantity) DESC;

-- Grant access to authenticated users
GRANT SELECT ON public.v_low_stock_alerts TO authenticated;
GRANT SELECT ON public.v_low_stock_alerts TO anon;
