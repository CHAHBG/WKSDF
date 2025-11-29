-- Create shop_settings table for multi-tenant shop configuration
CREATE TABLE IF NOT EXISTS shop_settings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    shop_name TEXT NOT NULL,
    location TEXT,
    phone_number TEXT,
    email TEXT,
    logo_url TEXT,  -- For shop logo storage (Supabase storage URL)
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add RLS policies
ALTER TABLE shop_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Enable read access for all users" ON shop_settings
    FOR SELECT USING (true);

CREATE POLICY "Enable insert for authenticated users only" ON shop_settings
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Enable update for authenticated users only" ON shop_settings
    FOR UPDATE USING (auth.role() = 'authenticated');
