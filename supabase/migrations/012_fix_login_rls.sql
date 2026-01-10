-- Fix RLS for users table to ensure login works
-- Drop potentially problematic policies from previous migrations
DROP POLICY IF EXISTS "Users can view users in their tenant" ON users;
DROP POLICY IF EXISTS "Users can view own profile" ON users;
DROP POLICY IF EXISTS "Users can view tenant members" ON users;
DROP POLICY IF EXISTS "Only owners can manage users" ON users;

-- 1. Simple policy for viewing own profile (Critical for login)
-- This ensures that querying for your own user ID always succeeds
CREATE POLICY "Users can view own profile"
ON users FOR SELECT
USING (auth.uid() = id);

-- 2. Helper function to safely get tenant_id without recursion
CREATE OR REPLACE FUNCTION get_current_user_tenant_id()
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN (SELECT tenant_id FROM users WHERE id = auth.uid());
END;
$$;

-- 3. Policy for viewing other members in the same tenant
CREATE POLICY "Users can view tenant members"
ON users FOR SELECT
USING (
  tenant_id = get_current_user_tenant_id()
);

-- 4. Policy for owners to manage users
CREATE POLICY "Only owners can manage users"
ON users FOR ALL
USING (
  tenant_id = get_current_user_tenant_id()
  AND EXISTS (
    SELECT 1 FROM users 
    WHERE id = auth.uid() 
    AND role = 'owner'
  )
);
