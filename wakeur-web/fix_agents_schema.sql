-- Fix agents table schema
-- 1. Ensure shop_id column exists
ALTER TABLE agents 
ADD COLUMN IF NOT EXISTS shop_id UUID REFERENCES shop_settings(id) ON DELETE CASCADE;

-- 2. Ensure RLS is enabled
ALTER TABLE agents ENABLE ROW LEVEL SECURITY;

-- 3. Refresh schema cache (PostgREST specific)
NOTIFY pgrst, 'reload schema';
