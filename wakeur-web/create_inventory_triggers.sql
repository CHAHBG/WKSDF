-- Function to log inventory changes
CREATE OR REPLACE FUNCTION log_inventory_change()
RETURNS TRIGGER AS $$
BEGIN
    IF OLD.quantity <> NEW.quantity THEN
        INSERT INTO inventory_logs (
            product_id,
            shop_id,
            change_type,
            quantity_change,
            previous_quantity,
            new_quantity,
            created_by
        ) VALUES (
            NEW.id,
            NEW.shop_id,
            CASE
                WHEN NEW.quantity > OLD.quantity THEN 'RESTOCK'
                ELSE 'SALE' -- Default assumption for decreases
            END,
            NEW.quantity - OLD.quantity,
            OLD.quantity,
            NEW.quantity,
            auth.uid()
        );
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger on products table
DROP TRIGGER IF EXISTS trigger_log_inventory_change ON products;
CREATE TRIGGER trigger_log_inventory_change
AFTER UPDATE ON products
FOR EACH ROW
EXECUTE FUNCTION log_inventory_change();
