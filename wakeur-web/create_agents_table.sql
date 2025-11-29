-- Create agents table for management purposes
-- This table stores agent details separate from auth.users for now
-- to allow admins to create agents without needing full auth flow immediately.

CREATE TABLE IF NOT EXISTS agents (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    phone TEXT,
    code TEXT, -- Login code or ID
    shop_id UUID REFERENCES shop_settings(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE agents ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Users can view own shop agents" ON agents
    FOR SELECT USING (shop_id = (SELECT shop_id FROM users_profile WHERE id = auth.uid()));

CREATE POLICY "Owners can insert agents" ON agents
    FOR INSERT WITH CHECK (
        shop_id = (SELECT shop_id FROM users_profile WHERE id = auth.uid()) AND
        EXISTS (SELECT 1 FROM users_profile WHERE id = auth.uid() AND role = 'owner')
    );

CREATE POLICY "Owners can update agents" ON agents
    FOR UPDATE USING (
        shop_id = (SELECT shop_id FROM users_profile WHERE id = auth.uid()) AND
        EXISTS (SELECT 1 FROM users_profile WHERE id = auth.uid() AND role = 'owner')
    );

CREATE POLICY "Owners can delete agents" ON agents
    FOR DELETE USING (
        shop_id = (SELECT shop_id FROM users_profile WHERE id = auth.uid()) AND
        EXISTS (SELECT 1 FROM users_profile WHERE id = auth.uid() AND role = 'owner')
    );
