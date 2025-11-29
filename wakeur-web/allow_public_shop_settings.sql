-- Enable RLS on shop_settings if not already enabled
ALTER TABLE shop_settings ENABLE ROW LEVEL SECURITY;

-- Create a policy to allow everyone (anon and authenticated) to read shop settings
-- This is necessary because agents log in via a custom flow and might be considered 'anon' by RLS
DO $$
BEGIN
    DROP POLICY IF EXISTS "Allow public read access to shop_settings" ON shop_settings;
    CREATE POLICY "Allow public read access to shop_settings"
    ON shop_settings FOR SELECT
    TO anon, authenticated
    USING (true);
END $$;

-- Refresh schema cache
NOTIFY pgrst, 'reload schema';
