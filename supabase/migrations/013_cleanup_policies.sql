-- Fix lingering recursive policies from migration 011
-- These policies were named differently than what 012 tried to drop

DROP POLICY IF EXISTS "Users can view users in their tenant or superadmin" ON users;
DROP POLICY IF EXISTS "Owners and Superadmins can manage users" ON users;

-- Re-apply the clean policies from 012 just in case, ensuring no duplicates or missing ones
-- (IF NOT EXISTS is not standard for CREATE POLICY, so we drop to be safe)

DROP POLICY IF EXISTS "Users can view own profile" ON users;
DROP POLICY IF EXISTS "Users can view tenant members" ON users;
DROP POLICY IF EXISTS "Only owners can manage users" ON users;

-- 1. Simple policy for viewing own profile (Critical for login)
CREATE POLICY "Users can view own profile"
ON users FOR SELECT
USING (auth.uid() = id);

-- 2. Policy for viewing other members in the same tenant
-- Uses the non-recursive function defined in 012 (get_current_user_tenant_id)
-- Note: 011 created 'get_current_tenant_id' but 012 created 'get_current_user_tenant_id'.
-- We should use the one from 012 which queries users table (safely? no wait)

-- Let's check 012's function:
-- CREATE OR REPLACE FUNCTION get_current_user_tenant_id() ... RETURN (SELECT tenant_id FROM users WHERE id = auth.uid());
-- This function is SECURITY DEFINER, so it bypasses RLS. This is safe from recursion.

CREATE POLICY "Users can view tenant members"
ON users FOR SELECT
USING (
  tenant_id = get_current_user_tenant_id()
);

-- 3. Policy for owners to manage users
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
