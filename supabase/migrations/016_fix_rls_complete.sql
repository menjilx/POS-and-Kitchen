-- Complete fix for RLS recursion
-- Problem: Original policies from 002_rls_policies.sql query users table directly,
-- causing infinite recursion when there's no profile
-- Solution: Drop ALL policies and recreate with SECURITY DEFINER functions

-- Drop ALL existing policies on users table (from all migrations)
DROP POLICY IF EXISTS "Users can view users in their tenant" ON users;
DROP POLICY IF EXISTS "Only owners can manage users" ON users;
DROP POLICY IF EXISTS "Users can view own profile" ON users;
DROP POLICY IF EXISTS "Users can view tenant members" ON users;
DROP POLICY IF EXISTS "Only owners can update users" ON users;
DROP POLICY IF EXISTS "Only owners can delete users" ON users;
DROP POLICY IF EXISTS "Users can create their own profile" ON users;

-- Drop existing functions
DROP FUNCTION IF EXISTS get_current_user_tenant_id();
DROP FUNCTION IF EXISTS is_current_user_owner();

-- Function to safely get current user's tenant_id (bypasses RLS)
CREATE OR REPLACE FUNCTION get_current_user_tenant_id()
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

-- Function to safely check if current user is owner (bypasses RLS)
CREATE OR REPLACE FUNCTION is_current_user_owner()
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_is_owner BOOLEAN;
BEGIN
  SELECT EXISTS (
    SELECT 1 FROM users
    WHERE id = auth.uid()
    AND role = 'owner'
  ) INTO v_is_owner;
  RETURN v_is_owner;
END;
$$;

-- Create simple, non-recursive policies
-- 1. Users can view their own profile
CREATE POLICY "Users can view own profile"
  ON users FOR SELECT
  USING (auth.uid() = id);

-- 2. Owners can view all users in their tenant
CREATE POLICY "Owners can view tenant members"
  ON users FOR SELECT
  USING (
    tenant_id = get_current_user_tenant_id()
    AND is_current_user_owner()
  );

-- 3. Owners can update users in their tenant
CREATE POLICY "Owners can update users"
  ON users FOR UPDATE
  USING (
    tenant_id = get_current_user_tenant_id()
    AND is_current_user_owner()
  );

-- 4. Owners can delete users in their tenant
CREATE POLICY "Owners can delete users"
  ON users FOR DELETE
  USING (
    tenant_id = get_current_user_tenant_id()
    AND is_current_user_owner()
  );

-- 5. Users can insert their own profile
CREATE POLICY "Users can create their own profile"
  ON users FOR INSERT
  WITH CHECK (auth.uid() = id);
