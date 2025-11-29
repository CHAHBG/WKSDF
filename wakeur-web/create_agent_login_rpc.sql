-- Create a secure function to handle agent login
-- This function bypasses RLS to check credentials and returns the agent record if valid

CREATE OR REPLACE FUNCTION login_agent(phone_input TEXT, code_input TEXT)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER -- This allows the function to run with the privileges of the creator (bypass RLS)
AS $$
DECLARE
    agent_record JSON;
BEGIN
    -- Select the agent matching the phone and code
    SELECT row_to_json(a)
    INTO agent_record
    FROM agents a
    WHERE a.phone = phone_input AND a.code = code_input;

    -- Return the record (will be null if no match)
    RETURN agent_record;
END;
$$;

-- Grant execute permission to anonymous and authenticated users
GRANT EXECUTE ON FUNCTION login_agent(TEXT, TEXT) TO anon, authenticated, service_role;

-- Refresh schema cache
NOTIFY pgrst, 'reload schema';
