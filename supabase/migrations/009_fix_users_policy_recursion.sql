-- ============================================
-- FIX INFINITE RECURSION IN USERS POLICIES
-- ============================================

-- Create a secure function to get the current user's tenant_id
-- This function runs with the privileges of the function creator (postgres), bypassing RLS
CREATE OR REPLACE FUNCTION get_auth_tenant_id()
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_tenant_id UUID;
BEGIN
  SELECT tenant_id INTO v_tenant_id
  FROM users
  WHERE id = auth.uid();
  
  RETURN v_tenant_id;
END;
$$;

-- Create a secure function to get the current user's role
CREATE OR REPLACE FUNCTION get_auth_user_role()
RETURNS VARCHAR
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_role VARCHAR;
BEGIN
  SELECT role INTO v_role
  FROM users
  WHERE id = auth.uid();
  
  RETURN v_role;
END;
$$;

-- Drop existing problematic policies that cause recursion
DROP POLICY IF EXISTS "Users can view users in their tenant" ON users;
DROP POLICY IF EXISTS "Only owners can manage users" ON users;

-- Re-create policies using the secure functions
-- 1. Users can view their own profile and other users in the same tenant
CREATE POLICY "Users can view users in their tenant"
  ON users FOR SELECT
  USING (
    auth.uid() = id OR tenant_id = get_auth_tenant_id()
  );

-- 2. Owners can manage users (update, delete, etc) in their tenant
CREATE POLICY "Only owners can manage users"
  ON users FOR ALL
  USING (
    tenant_id = get_auth_tenant_id()
    AND get_auth_user_role() = 'owner'
  );

-- Note: "Users can create their own profile" policy from 007_fix_signup_rls.sql is still active and handles INSERTs during signup
