-- Fix infinite recursion in users table policies
-- The "FOR ALL" policy was causing recursion when the UPSERT triggered policy evaluation
-- because get_current_user_tenant_id() queries the users table during INSERT

-- Drop the problematic ALL policy
DROP POLICY IF EXISTS "Only owners can manage users" ON users;

-- Re-create the policy for SELECT, UPDATE, DELETE (no INSERT - that has separate policy)
CREATE POLICY "Only owners can manage users"
  ON users FOR SELECT
  USING (
    tenant_id = get_current_user_tenant_id()
    AND EXISTS (
      SELECT 1 FROM users
      WHERE id = auth.uid()
      AND role = 'owner'
    )
  );

CREATE POLICY "Only owners can update users"
  ON users FOR UPDATE
  USING (
    tenant_id = get_current_user_tenant_id()
    AND EXISTS (
      SELECT 1 FROM users
      WHERE id = auth.uid()
      AND role = 'owner'
    )
  );

CREATE POLICY "Only owners can delete users"
  ON users FOR DELETE
  USING (
    tenant_id = get_current_user_tenant_id()
    AND EXISTS (
      SELECT 1 FROM users
      WHERE id = auth.uid()
      AND role = 'owner'
    )
  );
