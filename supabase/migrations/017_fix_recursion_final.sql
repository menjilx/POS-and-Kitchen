-- FIX: Complete RLS Overhaul to prevent recursion
-- 1. Drop ALL policies on users and tenants to ensure a clean slate
-- 2. Create helper functions that are SECURITY DEFINER (bypass RLS)
-- 3. Re-create policies using these functions

-- Drop policies explicitly mentioned in error messages first
DROP POLICY IF EXISTS "Only owners can update users" ON users;
DROP POLICY IF EXISTS "Only owners can delete users" ON users;
DROP POLICY IF EXISTS "Users can view users in their tenant" ON users;
DROP POLICY IF EXISTS "Only owners can manage users" ON users;
DROP POLICY IF EXISTS "Owners and Superadmins can manage users" ON users;
DROP POLICY IF EXISTS "Users can view users in their tenant or superadmin" ON users;
DROP POLICY IF EXISTS "Users can view own profile" ON users;
DROP POLICY IF EXISTS "Users can view tenant members" ON users;
DROP POLICY IF EXISTS "Owners can view tenant members" ON users;
DROP POLICY IF EXISTS "Users can create their own profile" ON users;

-- Drop existing policies on TENANTS
DROP POLICY IF EXISTS "Users can view their own tenant" ON tenants;
DROP POLICY IF EXISTS "Allow public to create tenants" ON tenants;

-- Drop functions to ensure clean recreation
DROP FUNCTION IF EXISTS get_current_user_tenant_id();
DROP FUNCTION IF EXISTS is_current_user_owner();

-- 1. Secure function to get current user's tenant_id
CREATE OR REPLACE FUNCTION get_current_user_tenant_id()
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_tenant_id UUID;
BEGIN
  -- Direct query to users table, bypassing RLS due to SECURITY DEFINER
  SELECT tenant_id INTO v_tenant_id
  FROM users
  WHERE id = auth.uid();
  
  RETURN v_tenant_id;
END;
$$;

-- 2. Secure function to check if current user is owner
CREATE OR REPLACE FUNCTION is_current_user_owner()
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_is_owner BOOLEAN;
BEGIN
  -- Direct query to users table, bypassing RLS due to SECURITY DEFINER
  SELECT EXISTS (
    SELECT 1 FROM users
    WHERE id = auth.uid()
    AND role = 'owner'
  ) INTO v_is_owner;
  
  RETURN v_is_owner;
END;
$$;

-- 3. USERS Policies (Non-recursive)

-- Allow users to view their own profile
CREATE POLICY "Users can view own profile"
  ON users FOR SELECT
  USING (auth.uid() = id);

-- Allow owners to view all members of their tenant
CREATE POLICY "Owners can view tenant members"
  ON users FOR SELECT
  USING (
    tenant_id = get_current_user_tenant_id() 
    AND is_current_user_owner()
  );

-- Allow owners to update members of their tenant
CREATE POLICY "Owners can update tenant members"
  ON users FOR UPDATE
  USING (
    tenant_id = get_current_user_tenant_id() 
    AND is_current_user_owner()
  );

-- Allow owners to delete members of their tenant
CREATE POLICY "Owners can delete tenant members"
  ON users FOR DELETE
  USING (
    tenant_id = get_current_user_tenant_id() 
    AND is_current_user_owner()
  );

-- Allow users to create their own profile (Critical for signup/setup)
CREATE POLICY "Users can create their own profile"
  ON users FOR INSERT
  WITH CHECK (auth.uid() = id);

-- 4. TENANTS Policies (Using secure function)

-- Allow users to view their own tenant
CREATE POLICY "Users can view their own tenant"
  ON tenants FOR SELECT
  USING (id = get_current_user_tenant_id());

-- Allow public to create tenants (needed for registration)
-- Check if this policy exists first or just create it if needed
-- Assuming registration needs insert access
CREATE POLICY "Allow public to create tenants"
  ON tenants FOR INSERT
  WITH CHECK (true);
