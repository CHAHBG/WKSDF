-- Fix for Shop Setup RPC and Permissions
-- Run this entire script in Supabase SQL Editor

-- 1. Create the missing RPC function for Shop Initialization
CREATE OR REPLACE FUNCTION public.initialize_owner_shop(
    p_shop_name TEXT,
    p_location TEXT DEFAULT NULL,
    p_phone_number TEXT DEFAULT NULL,
    p_email TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_user_id UUID := auth.uid();
    v_shop_id UUID;
    v_profile_exists BOOLEAN;
BEGIN
    -- Check if user exists in profiles, if not create as owner
    SELECT EXISTS(SELECT 1 FROM users_profile WHERE id = v_user_id) INTO v_profile_exists;
    
    IF NOT v_profile_exists THEN
        INSERT INTO users_profile (id, role)
        VALUES (v_user_id, 'owner');
    END IF;

    -- Create the shop settings
    INSERT INTO shop_settings (shop_name, location, phone_number, email, owner_id)
    VALUES (p_shop_name, p_location, p_phone_number, p_email, v_user_id)
    RETURNING id INTO v_shop_id;

    -- Link the owner profile to the new shop
    UPDATE users_profile
    SET shop_id = v_shop_id,
        role = 'owner'
    WHERE id = v_user_id;

    RETURN jsonb_build_object(
        'success', true,
        'shop_id', v_shop_id,
        'message', 'Shop initialized successfully'
    );
EXCEPTION WHEN OTHERS THEN
    RETURN jsonb_build_object(
        'success', false,
        'error', SQLERRM,
        'code', SQLSTATE
    );
END;
$$;

-- 2. Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION public.initialize_owner_shop TO authenticated;

-- 3. Ensure users_profile policies are correct (Upsert fix)
ALTER TABLE users_profile ENABLE ROW LEVEL SECURITY;

-- Allow users to insert their *own* profile if it doesn't exist
DROP POLICY IF EXISTS "Users create own profile" ON users_profile;
CREATE POLICY "Users create own profile" ON users_profile
  FOR INSERT WITH CHECK (
    id = auth.uid()
  );

-- Ensure users can update their own profile
DROP POLICY IF EXISTS "Users update own profile" ON users_profile;
CREATE POLICY "Users update own profile" ON users_profile
  FOR UPDATE USING (
    id = auth.uid()
  );
