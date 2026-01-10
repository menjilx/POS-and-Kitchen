-- 1. Make tenant_id nullable in users table
ALTER TABLE users ALTER COLUMN tenant_id DROP NOT NULL;

-- 2. Migrate existing super_admins to users table
INSERT INTO public.users (id, email, full_name, role, tenant_id, status)
SELECT 
    sa.user_id,
    sa.email,
    sa.full_name,
    'superadmin',
    NULL,
    'active'
FROM super_admins sa
ON CONFLICT (id) DO UPDATE
SET 
    role = 'superadmin',
    tenant_id = NULL;

-- 2.5 Drop dependent policies before dropping the table
DROP POLICY IF EXISTS "Superadmins can manage all settings" ON app_settings;

-- 3. Drop super_admins table
DROP TABLE IF EXISTS super_admins;

-- 4. Update helper functions to rely on users table instead of super_admins

-- Update is_superadmin function
CREATE OR REPLACE FUNCTION is_superadmin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM users 
    WHERE id = auth.uid() 
    AND role = 'superadmin'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Update get_current_tenant_id function
CREATE OR REPLACE FUNCTION get_current_tenant_id()
RETURNS UUID AS $$
DECLARE
    v_role text;
    v_tenant_id uuid;
BEGIN
  SELECT role, tenant_id INTO v_role, v_tenant_id
  FROM users 
  WHERE id = auth.uid();
  
  -- Superadmins return NULL (they can access all tenants)
  IF v_role = 'superadmin' THEN
    RETURN NULL;
  END IF;
  
  -- Regular users return their tenant_id
  RETURN v_tenant_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 5. Update RLS policies for USERS table
-- Drop existing conflicting policies
DROP POLICY IF EXISTS "Users can view users in their tenant" ON users;
DROP POLICY IF EXISTS "Only owners can manage users" ON users;

-- Users can view: themselves, people in their tenant, OR if they are superadmin
-- We use helper functions (defined in 009 or here) to avoid infinite recursion
CREATE POLICY "Users can view users in their tenant or superadmin"
  ON users FOR SELECT
  USING (
    (auth.uid() = id) OR 
    is_superadmin() OR
    (tenant_id IS NOT NULL AND tenant_id = get_auth_tenant_id())
  );

-- Management policy
CREATE POLICY "Owners and Superadmins can manage users"
  ON users FOR ALL
  USING (
    is_superadmin() OR
    (get_auth_user_role() = 'owner' AND tenant_id = get_auth_tenant_id())
  );

-- 6. Update RLS policies for TENANTS table
DROP POLICY IF EXISTS "Users can view their own tenant" ON tenants;

CREATE POLICY "Users can view their own tenant or superadmin"
  ON tenants FOR SELECT
  USING (
    is_superadmin() OR
    id = get_auth_tenant_id()
  );

CREATE POLICY "Superadmins can manage tenants"
  ON tenants FOR ALL
  USING (
    is_superadmin()
  );

-- 7. Add Superadmin Access Policy to ALL other tables
DO $$
DECLARE
    t text;
    tables text[] := ARRAY[
        'ingredient_categories', 'ingredients', 'locations', 'stock', 
        'stock_adjustments', 'stocktakes', 'stocktake_items', 'menu_items', 
        'recipe_items', 'suppliers', 'purchases', 'purchase_items', 
        'tables', 'reservations', 'sales', 'sale_items', 
        'kds_orders', 'kds_order_items', 'expense_categories', 'expenses',
        'app_settings'
    ];
BEGIN
    FOREACH t IN ARRAY tables LOOP
        EXECUTE format('DROP POLICY IF EXISTS "Superadmins can do everything on %I" ON %I', t, t);
        EXECUTE format('CREATE POLICY "Superadmins can do everything on %I" ON %I FOR ALL USING (is_superadmin())', t, t);
    END LOOP;
END $$;
