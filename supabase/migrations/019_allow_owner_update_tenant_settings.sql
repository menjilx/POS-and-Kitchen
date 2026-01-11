-- Allow owners to update their own tenant settings

DROP POLICY IF EXISTS "Owners can update tenant settings" ON tenants;

CREATE POLICY "Owners can update tenant settings"
  ON tenants FOR UPDATE
  USING (
    id = get_auth_tenant_id()
    AND get_auth_user_role() = 'owner'
  )
  WITH CHECK (
    id = get_auth_tenant_id()
    AND get_auth_user_role() = 'owner'
  );
