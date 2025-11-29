-- Add payment_method to expenses
ALTER TABLE expenses ADD COLUMN IF NOT EXISTS payment_method TEXT DEFAULT 'cash' CHECK (payment_method IN ('cash', 'mobile_money'));

-- Create inventory_logs table
CREATE TABLE IF NOT EXISTS inventory_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    product_id UUID REFERENCES products(id) ON DELETE CASCADE,
    shop_id UUID REFERENCES shop_settings(id) ON DELETE CASCADE,
    change_type TEXT NOT NULL CHECK (change_type IN ('SALE', 'RESTOCK', 'ADJUSTMENT', 'RETURN')),
    quantity_change INTEGER NOT NULL,
    previous_quantity INTEGER,
    new_quantity INTEGER,
    notes TEXT,
    created_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE inventory_logs ENABLE ROW LEVEL SECURITY;

-- Create policy for inventory_logs
CREATE POLICY "Enable read access for authenticated users" ON inventory_logs FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Enable insert access for authenticated users" ON inventory_logs FOR INSERT WITH CHECK (auth.role() = 'authenticated');
