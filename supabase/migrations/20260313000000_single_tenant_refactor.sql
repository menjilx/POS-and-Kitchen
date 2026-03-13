-- ============================================
-- SINGLE TENANT REFACTOR MIGRATION
-- Removes multi-tenancy and superadmin features.
-- All business data is preserved; only tenant_id columns are dropped.
-- ============================================

BEGIN;

-- ============================================
-- 1A. MIGRATE TENANT SETTINGS TO APP_SETTINGS
-- Copy currency, timezone, tax_rate from first tenant's settings JSONB
-- ============================================

-- Migrate tenant settings values into app_settings before we drop the tenants table
DO $$
DECLARE
  v_settings JSONB;
  v_currency TEXT;
  v_timezone TEXT;
  v_tax_rate TEXT;
  v_payment_methods TEXT;
  v_receipt_settings TEXT;
  v_features_menu TEXT;
BEGIN
  -- Get settings from the first tenant
  SELECT settings INTO v_settings
  FROM tenants
  WHERE settings IS NOT NULL
  ORDER BY created_at ASC
  LIMIT 1;

  IF v_settings IS NOT NULL THEN
    v_currency := v_settings->>'currency';
    v_timezone := v_settings->>'timezone';
    v_tax_rate := v_settings->>'tax_rate';

    IF v_currency IS NOT NULL THEN
      UPDATE app_settings SET value = v_currency, updated_at = NOW() WHERE key = 'currency';
    END IF;
    IF v_timezone IS NOT NULL THEN
      UPDATE app_settings SET value = v_timezone, updated_at = NOW() WHERE key = 'timezone';
    END IF;
    IF v_tax_rate IS NOT NULL THEN
      UPDATE app_settings SET value = v_tax_rate, updated_at = NOW() WHERE key = 'tax_rate';
    END IF;

    -- Migrate payment methods
    v_payment_methods := v_settings->'paymentMethods'::TEXT;
    IF v_payment_methods IS NOT NULL AND v_payment_methods != 'null' THEN
      INSERT INTO app_settings (key, value, value_type, description, category)
      VALUES ('payment_methods', v_payment_methods, 'json', 'Configured payment methods', 'pos')
      ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value, updated_at = NOW();
    END IF;

    -- Migrate receipt settings
    v_receipt_settings := v_settings->'receipt'::TEXT;
    IF v_receipt_settings IS NOT NULL AND v_receipt_settings != 'null' THEN
      INSERT INTO app_settings (key, value, value_type, description, category)
      VALUES ('receipt_settings', v_receipt_settings, 'json', 'Receipt display settings', 'pos')
      ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value, updated_at = NOW();
    END IF;

    -- Migrate features.menu
    v_features_menu := v_settings->'features'->>'menu';
    IF v_features_menu IS NOT NULL THEN
      INSERT INTO app_settings (key, value, value_type, description, category)
      VALUES ('features_menu', v_features_menu, 'boolean', 'Enable menu module', 'general')
      ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value, updated_at = NOW();
    END IF;
  END IF;
END $$;


-- ============================================
-- 1B. DROP ALL TENANT-RELATED RLS POLICIES
-- We drop ALL policies on all affected tables, then recreate simplified ones.
-- Must happen BEFORE dropping is_superadmin() since policies depend on it.
-- ============================================

-- Helper: drop all policies on a table
DO $$
DECLARE
  r RECORD;
  tables_to_clean TEXT[] := ARRAY[
    'users', 'tenants', 'ingredient_categories', 'ingredients', 'locations',
    'stock', 'stock_adjustments', 'stocktakes', 'stocktake_items',
    'menu_items', 'menu_categories', 'recipe_items', 'suppliers',
    'purchases', 'purchase_items', 'purchase_attachments',
    'tables', 'reservations', 'sales', 'sale_items', 'sale_history',
    'kds_orders', 'kds_order_items', 'expense_categories', 'expenses',
    'discounts', 'cashier_sessions', 'customers', 'kitchen_displays',
    'role_permissions', 'order_number_counters', 'app_settings'
  ];
  t TEXT;
BEGIN
  FOREACH t IN ARRAY tables_to_clean LOOP
    FOR r IN
      SELECT policyname FROM pg_policies WHERE tablename = t AND schemaname = 'public'
    LOOP
      EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I', r.policyname, t);
    END LOOP;
  END LOOP;
END $$;


-- ============================================
-- 1C. DROP SUPERADMIN-ONLY DB OBJECTS
-- (Now safe — policies that referenced these functions are already dropped)
-- ============================================

-- Drop superadmin functions
DROP FUNCTION IF EXISTS is_superadmin();
DROP FUNCTION IF EXISTS get_all_tenants();
DROP FUNCTION IF EXISTS suspend_tenant(UUID, TEXT);
DROP FUNCTION IF EXISTS reactivate_tenant(UUID);
DROP FUNCTION IF EXISTS delete_tenant(UUID);
DROP FUNCTION IF EXISTS get_current_tenant_id();

-- Drop system_settings table
DROP TABLE IF EXISTS system_settings;

-- Delete superadmin users (from public.users, auth cascade handles auth.users)
DELETE FROM public.users WHERE role = 'superadmin';

-- Update role CHECK constraint: remove 'superadmin', keep only owner/manager/staff
ALTER TABLE users DROP CONSTRAINT IF EXISTS users_role_check;
ALTER TABLE users ADD CONSTRAINT users_role_check
  CHECK (role IN ('owner', 'manager', 'staff'));


-- ============================================
-- 1D. DROP TENANT_ID FROM ALL TABLES
-- Drop FK constraints, unique constraints, indexes, then columns
-- ============================================

-- Drop tenant_id indexes first
DROP INDEX IF EXISTS idx_users_tenant;
DROP INDEX IF EXISTS idx_ingredients_tenant;
DROP INDEX IF EXISTS idx_stock_tenant;
DROP INDEX IF EXISTS idx_menu_items_tenant;
DROP INDEX IF EXISTS idx_sales_tenant;
DROP INDEX IF EXISTS idx_kds_orders_tenant;
DROP INDEX IF EXISTS idx_reservations_tenant;
DROP INDEX IF EXISTS idx_tables_tenant;
DROP INDEX IF EXISTS idx_stock_adjustments_tenant;
DROP INDEX IF EXISTS idx_purchases_tenant;
DROP INDEX IF EXISTS idx_expenses_tenant;
DROP INDEX IF EXISTS idx_menu_categories_tenant;
DROP INDEX IF EXISTS idx_customers_tenant_id;
DROP INDEX IF EXISTS idx_sale_history_tenant_id;

-- Drop unique constraints that include tenant_id (they block column drops)
ALTER TABLE ingredient_categories DROP CONSTRAINT IF EXISTS ingredient_categories_tenant_id_name_key;
ALTER TABLE ingredients DROP CONSTRAINT IF EXISTS ingredients_tenant_id_name_key;
ALTER TABLE locations DROP CONSTRAINT IF EXISTS locations_tenant_id_name_key;
ALTER TABLE suppliers DROP CONSTRAINT IF EXISTS suppliers_tenant_id_name_key;
ALTER TABLE tables DROP CONSTRAINT IF EXISTS tables_tenant_id_table_number_key;
ALTER TABLE expense_categories DROP CONSTRAINT IF EXISTS expense_categories_tenant_id_name_key;
ALTER TABLE kitchen_displays DROP CONSTRAINT IF EXISTS kitchen_displays_tenant_id_name_key;
ALTER TABLE menu_categories DROP CONSTRAINT IF EXISTS menu_categories_tenant_id_name_key;
ALTER TABLE sales DROP CONSTRAINT IF EXISTS sales_tenant_id_order_number_key;
ALTER TABLE users DROP CONSTRAINT IF EXISTS users_email_tenant_id_key;
ALTER TABLE role_permissions DROP CONSTRAINT IF EXISTS role_permissions_tenant_id_role_key;
ALTER TABLE discounts DROP CONSTRAINT IF EXISTS discounts_tenant_id_name_key;

-- Drop FK constraints referencing tenants(id)
ALTER TABLE users DROP CONSTRAINT IF EXISTS users_tenant_id_fkey;
ALTER TABLE ingredient_categories DROP CONSTRAINT IF EXISTS ingredient_categories_tenant_id_fkey;
ALTER TABLE ingredients DROP CONSTRAINT IF EXISTS ingredients_tenant_id_fkey;
ALTER TABLE locations DROP CONSTRAINT IF EXISTS locations_tenant_id_fkey;
ALTER TABLE stock DROP CONSTRAINT IF EXISTS stock_tenant_id_fkey;
ALTER TABLE stock_adjustments DROP CONSTRAINT IF EXISTS stock_adjustments_tenant_id_fkey;
ALTER TABLE stocktakes DROP CONSTRAINT IF EXISTS stocktakes_tenant_id_fkey;
ALTER TABLE menu_items DROP CONSTRAINT IF EXISTS menu_items_tenant_id_fkey;
ALTER TABLE menu_categories DROP CONSTRAINT IF EXISTS menu_categories_tenant_id_fkey;
ALTER TABLE suppliers DROP CONSTRAINT IF EXISTS suppliers_tenant_id_fkey;
ALTER TABLE purchases DROP CONSTRAINT IF EXISTS purchases_tenant_id_fkey;
ALTER TABLE tables DROP CONSTRAINT IF EXISTS tables_tenant_id_fkey;
ALTER TABLE reservations DROP CONSTRAINT IF EXISTS reservations_tenant_id_fkey;
ALTER TABLE sales DROP CONSTRAINT IF EXISTS sales_tenant_id_fkey;
ALTER TABLE sale_history DROP CONSTRAINT IF EXISTS sale_history_tenant_id_fkey;
ALTER TABLE kds_orders DROP CONSTRAINT IF EXISTS kds_orders_tenant_id_fkey;
ALTER TABLE expense_categories DROP CONSTRAINT IF EXISTS expense_categories_tenant_id_fkey;
ALTER TABLE expenses DROP CONSTRAINT IF EXISTS expenses_tenant_id_fkey;
ALTER TABLE cashier_sessions DROP CONSTRAINT IF EXISTS cashier_sessions_tenant_id_fkey;
ALTER TABLE customers DROP CONSTRAINT IF EXISTS customers_tenant_id_fkey;
ALTER TABLE kitchen_displays DROP CONSTRAINT IF EXISTS kitchen_displays_tenant_id_fkey;
ALTER TABLE discounts DROP CONSTRAINT IF EXISTS discounts_tenant_id_fkey;
ALTER TABLE role_permissions DROP CONSTRAINT IF EXISTS role_permissions_tenant_id_fkey;

-- Now drop tenant_id columns
ALTER TABLE users DROP COLUMN IF EXISTS tenant_id;
ALTER TABLE ingredient_categories DROP COLUMN IF EXISTS tenant_id;
ALTER TABLE ingredients DROP COLUMN IF EXISTS tenant_id;
ALTER TABLE locations DROP COLUMN IF EXISTS tenant_id;
ALTER TABLE stock DROP COLUMN IF EXISTS tenant_id;
ALTER TABLE stock_adjustments DROP COLUMN IF EXISTS tenant_id;
ALTER TABLE stocktakes DROP COLUMN IF EXISTS tenant_id;
ALTER TABLE menu_items DROP COLUMN IF EXISTS tenant_id;
ALTER TABLE menu_categories DROP COLUMN IF EXISTS tenant_id;
ALTER TABLE suppliers DROP COLUMN IF EXISTS tenant_id;
ALTER TABLE purchases DROP COLUMN IF EXISTS tenant_id;
ALTER TABLE tables DROP COLUMN IF EXISTS tenant_id;
ALTER TABLE reservations DROP COLUMN IF EXISTS tenant_id;
ALTER TABLE sales DROP COLUMN IF EXISTS tenant_id;
ALTER TABLE sale_history DROP COLUMN IF EXISTS tenant_id;
ALTER TABLE kds_orders DROP COLUMN IF EXISTS tenant_id;
ALTER TABLE expense_categories DROP COLUMN IF EXISTS tenant_id;
ALTER TABLE expenses DROP COLUMN IF EXISTS tenant_id;
ALTER TABLE cashier_sessions DROP COLUMN IF EXISTS tenant_id;
ALTER TABLE customers DROP COLUMN IF EXISTS tenant_id;
ALTER TABLE kitchen_displays DROP COLUMN IF EXISTS tenant_id;
ALTER TABLE discounts DROP COLUMN IF EXISTS tenant_id;
ALTER TABLE role_permissions DROP COLUMN IF EXISTS tenant_id;

-- Drop tenants table
DROP TABLE IF EXISTS tenants CASCADE;

-- Drop order_number_counters (keyed by tenant_id) and recreate as single-row
DROP TABLE IF EXISTS order_number_counters;
CREATE TABLE order_number_counters (
  id INTEGER PRIMARY KEY DEFAULT 1 CHECK (id = 1),
  last_number BIGINT NOT NULL DEFAULT 0,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
ALTER TABLE order_number_counters ENABLE ROW LEVEL SECURITY;


-- ============================================
-- 1E. RE-ADD UNIQUE CONSTRAINTS (without tenant_id)
-- ============================================

ALTER TABLE ingredient_categories ADD CONSTRAINT ingredient_categories_name_key UNIQUE (name);
ALTER TABLE locations ADD CONSTRAINT locations_name_key UNIQUE (name);
ALTER TABLE suppliers ADD CONSTRAINT suppliers_name_key UNIQUE (name);
ALTER TABLE tables ADD CONSTRAINT tables_table_number_key UNIQUE (table_number);
ALTER TABLE expense_categories ADD CONSTRAINT expense_categories_name_key UNIQUE (name);
ALTER TABLE kitchen_displays ADD CONSTRAINT kitchen_displays_name_key UNIQUE (name);
ALTER TABLE menu_categories ADD CONSTRAINT menu_categories_name_key UNIQUE (name);
ALTER TABLE sales ADD CONSTRAINT sales_order_number_key UNIQUE (order_number);
ALTER TABLE role_permissions ADD CONSTRAINT role_permissions_role_key UNIQUE (role);
ALTER TABLE discounts ADD CONSTRAINT discounts_name_key UNIQUE (name);
-- Note: users.email uniqueness - users already have PK on id referencing auth.users
-- and email is managed by auth.users which enforces uniqueness
ALTER TABLE users ADD CONSTRAINT users_email_key UNIQUE (email);


-- ============================================
-- 1F. RECREATE SIMPLIFIED RLS POLICIES
-- Pattern: SELECT = any authenticated user; write = role-based
-- ============================================

-- Helper function (kept, simplified)
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

-- ---- USERS ----
CREATE POLICY "Authenticated users can view all users"
  ON users FOR SELECT
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "Users can insert own profile"
  ON users FOR INSERT
  WITH CHECK (id = auth.uid());

CREATE POLICY "Owners can manage users"
  ON users FOR ALL
  USING (get_auth_user_role() = 'owner');

-- ---- APP_SETTINGS ----
CREATE POLICY "Authenticated users can view settings"
  ON app_settings FOR SELECT
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "Owners can manage settings"
  ON app_settings FOR ALL
  USING (get_auth_user_role() = 'owner');

-- ---- ROLE_PERMISSIONS ----
CREATE POLICY "Authenticated users can view role permissions"
  ON role_permissions FOR SELECT
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "Owners can manage role permissions"
  ON role_permissions FOR ALL
  USING (get_auth_user_role() = 'owner');

-- ---- ORDER_NUMBER_COUNTERS ----
CREATE POLICY "Authenticated users can use order counters"
  ON order_number_counters FOR ALL
  USING (auth.uid() IS NOT NULL);

-- ---- INGREDIENT_CATEGORIES ----
CREATE POLICY "Authenticated users can view ingredient categories"
  ON ingredient_categories FOR SELECT
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "Owners and managers can manage ingredient categories"
  ON ingredient_categories FOR ALL
  USING (get_auth_user_role() IN ('owner', 'manager'));

-- ---- INGREDIENTS ----
CREATE POLICY "Authenticated users can view ingredients"
  ON ingredients FOR SELECT
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "Owners and managers can manage ingredients"
  ON ingredients FOR ALL
  USING (get_auth_user_role() IN ('owner', 'manager'));

-- ---- LOCATIONS ----
CREATE POLICY "Authenticated users can view locations"
  ON locations FOR SELECT
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "Owners and managers can manage locations"
  ON locations FOR ALL
  USING (get_auth_user_role() IN ('owner', 'manager'));

-- ---- STOCK ----
CREATE POLICY "Authenticated users can view stock"
  ON stock FOR SELECT
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "Staff can manage stock"
  ON stock FOR ALL
  USING (get_auth_user_role() IN ('owner', 'manager', 'staff'));

-- ---- STOCK_ADJUSTMENTS ----
CREATE POLICY "Authenticated users can view stock adjustments"
  ON stock_adjustments FOR SELECT
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "Staff can create stock adjustments"
  ON stock_adjustments FOR INSERT
  WITH CHECK (get_auth_user_role() IN ('owner', 'manager', 'staff'));

-- ---- STOCKTAKES ----
CREATE POLICY "Authenticated users can view stocktakes"
  ON stocktakes FOR SELECT
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "Staff can create stocktakes"
  ON stocktakes FOR INSERT
  WITH CHECK (get_auth_user_role() IN ('owner', 'manager', 'staff'));

-- ---- STOCKTAKE_ITEMS ----
CREATE POLICY "Authenticated users can view stocktake items"
  ON stocktake_items FOR SELECT
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "Staff can create stocktake items"
  ON stocktake_items FOR INSERT
  WITH CHECK (get_auth_user_role() IN ('owner', 'manager', 'staff'));

-- ---- MENU_ITEMS ----
CREATE POLICY "Authenticated users can view menu items"
  ON menu_items FOR SELECT
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "Owners and managers can manage menu items"
  ON menu_items FOR ALL
  USING (get_auth_user_role() IN ('owner', 'manager'));

-- ---- MENU_CATEGORIES ----
CREATE POLICY "Authenticated users can view menu categories"
  ON menu_categories FOR SELECT
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "Owners and managers can manage menu categories"
  ON menu_categories FOR ALL
  USING (get_auth_user_role() IN ('owner', 'manager'));

-- ---- RECIPE_ITEMS ----
CREATE POLICY "Authenticated users can view recipe items"
  ON recipe_items FOR SELECT
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "Owners and managers can manage recipe items"
  ON recipe_items FOR ALL
  USING (get_auth_user_role() IN ('owner', 'manager'));

-- ---- SUPPLIERS ----
CREATE POLICY "Authenticated users can view suppliers"
  ON suppliers FOR SELECT
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "Owners and managers can manage suppliers"
  ON suppliers FOR ALL
  USING (get_auth_user_role() IN ('owner', 'manager'));

-- ---- PURCHASES ----
CREATE POLICY "Authenticated users can view purchases"
  ON purchases FOR SELECT
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "Staff can create purchases"
  ON purchases FOR INSERT
  WITH CHECK (get_auth_user_role() IN ('owner', 'manager', 'staff'));

CREATE POLICY "Owners and managers can manage purchases"
  ON purchases FOR ALL
  USING (get_auth_user_role() IN ('owner', 'manager'));

-- ---- PURCHASE_ITEMS ----
CREATE POLICY "Authenticated users can view purchase items"
  ON purchase_items FOR SELECT
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "Staff can manage purchase items"
  ON purchase_items FOR ALL
  USING (get_auth_user_role() IN ('owner', 'manager', 'staff'));

-- ---- PURCHASE_ATTACHMENTS ----
CREATE POLICY "Authenticated users can view purchase attachments"
  ON purchase_attachments FOR SELECT
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "Staff can create purchase attachments"
  ON purchase_attachments FOR INSERT
  WITH CHECK (get_auth_user_role() IN ('owner', 'manager', 'staff'));

CREATE POLICY "Owners and managers can delete purchase attachments"
  ON purchase_attachments FOR DELETE
  USING (get_auth_user_role() IN ('owner', 'manager'));

-- ---- TABLES ----
CREATE POLICY "Authenticated users can view tables"
  ON tables FOR SELECT
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "Owners and managers can manage tables"
  ON tables FOR ALL
  USING (get_auth_user_role() IN ('owner', 'manager'));

-- ---- RESERVATIONS ----
CREATE POLICY "Authenticated users can view reservations"
  ON reservations FOR SELECT
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "Staff can manage reservations"
  ON reservations FOR ALL
  USING (get_auth_user_role() IN ('owner', 'manager', 'staff'));

-- ---- SALES ----
CREATE POLICY "Authenticated users can view sales"
  ON sales FOR SELECT
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "Staff can create sales"
  ON sales FOR INSERT
  WITH CHECK (get_auth_user_role() IN ('owner', 'manager', 'staff'));

CREATE POLICY "Owners and managers can manage sales"
  ON sales FOR ALL
  USING (get_auth_user_role() IN ('owner', 'manager'));

-- ---- SALE_ITEMS ----
CREATE POLICY "Authenticated users can view sale items"
  ON sale_items FOR SELECT
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "Staff can manage sale items"
  ON sale_items FOR ALL
  USING (get_auth_user_role() IN ('owner', 'manager', 'staff'));

-- ---- SALE_HISTORY ----
CREATE POLICY "Authenticated users can view sale history"
  ON sale_history FOR SELECT
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "Staff can insert sale history"
  ON sale_history FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);

-- ---- KDS_ORDERS ----
CREATE POLICY "Authenticated users can view kds orders"
  ON kds_orders FOR SELECT
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "Staff can manage kds orders"
  ON kds_orders FOR ALL
  USING (get_auth_user_role() IN ('owner', 'manager', 'staff'));

-- ---- KDS_ORDER_ITEMS ----
CREATE POLICY "Authenticated users can view kds order items"
  ON kds_order_items FOR SELECT
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "Staff can manage kds order items"
  ON kds_order_items FOR ALL
  USING (get_auth_user_role() IN ('owner', 'manager', 'staff'));

-- ---- EXPENSE_CATEGORIES ----
CREATE POLICY "Authenticated users can view expense categories"
  ON expense_categories FOR SELECT
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "Owners and managers can manage expense categories"
  ON expense_categories FOR ALL
  USING (get_auth_user_role() IN ('owner', 'manager'));

-- ---- EXPENSES ----
CREATE POLICY "Authenticated users can view expenses"
  ON expenses FOR SELECT
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "Owners and managers can manage expenses"
  ON expenses FOR ALL
  USING (get_auth_user_role() IN ('owner', 'manager'));

-- ---- DISCOUNTS ----
CREATE POLICY "Authenticated users can view discounts"
  ON discounts FOR SELECT
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "Owners and managers can manage discounts"
  ON discounts FOR ALL
  USING (get_auth_user_role() IN ('owner', 'manager'));

-- ---- CASHIER_SESSIONS ----
CREATE POLICY "Authenticated users can view cashier sessions"
  ON cashier_sessions FOR SELECT
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "Users can manage own cashier sessions"
  ON cashier_sessions FOR INSERT
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own cashier sessions"
  ON cashier_sessions FOR UPDATE
  USING (user_id = auth.uid());

-- ---- CUSTOMERS ----
CREATE POLICY "Authenticated users can view customers"
  ON customers FOR SELECT
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "Staff can manage customers"
  ON customers FOR ALL
  USING (get_auth_user_role() IN ('owner', 'manager', 'staff'));

-- ---- KITCHEN_DISPLAYS ----
CREATE POLICY "Authenticated users can view kitchen displays"
  ON kitchen_displays FOR SELECT
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "Owners and managers can manage kitchen displays"
  ON kitchen_displays FOR ALL
  USING (get_auth_user_role() IN ('owner', 'manager'));


-- ============================================
-- 1G. UPDATE SQL FUNCTIONS
-- ============================================

-- Drop get_auth_tenant_id (no longer needed)
DROP FUNCTION IF EXISTS get_auth_tenant_id();

-- get_all_settings: allow owners instead of superadmins
CREATE OR REPLACE FUNCTION get_all_settings()
RETURNS JSONB AS $$
BEGIN
  IF get_auth_user_role() != 'owner' THEN
    RAISE EXCEPTION 'Access denied: Owner privileges required';
  END IF;

  RETURN (
    SELECT jsonb_object_agg(key, jsonb_build_object(
      'value', value,
      'value_type', value_type,
      'description', description,
      'category', category,
      'options', options
    ))
    FROM app_settings
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- update_app_setting: owner check
CREATE OR REPLACE FUNCTION update_app_setting(
  p_key VARCHAR,
  p_value TEXT
) RETURNS BOOLEAN AS $$
BEGIN
  IF get_auth_user_role() != 'owner' THEN
    RAISE EXCEPTION 'Access denied: Owner privileges required';
  END IF;

  UPDATE app_settings
  SET value = p_value, updated_at = NOW()
  WHERE key = p_key;

  RETURN FOUND;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- bulk_update_settings: owner check
CREATE OR REPLACE FUNCTION bulk_update_settings(p_settings JSONB)
RETURNS BOOLEAN AS $$
DECLARE
  key_text TEXT;
  value_text TEXT;
BEGIN
  IF get_auth_user_role() != 'owner' THEN
    RAISE EXCEPTION 'Access denied: Owner privileges required';
  END IF;

  FOR key_text, value_text IN SELECT * FROM jsonb_each_text(p_settings)
  LOOP
    UPDATE app_settings
    SET value = value_text, updated_at = NOW()
    WHERE key = key_text;
  END LOOP;

  RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- generate_order_number: remove tenant param
CREATE OR REPLACE FUNCTION generate_order_number()
RETURNS VARCHAR AS $$
DECLARE
  v_count BIGINT;
  v_order_number VARCHAR;
BEGIN
  SELECT COUNT(*) INTO v_count
  FROM sales
  WHERE DATE(sale_time) = CURRENT_DATE;

  v_count := v_count + 1;
  v_order_number := 'ORD-' || TO_CHAR(CURRENT_DATE, 'YYYYMMDD') || '-' || LPAD(v_count::TEXT, 4, '0');

  RETURN v_order_number;
END;
$$ LANGUAGE plpgsql;

-- Drop old version with tenant param
DROP FUNCTION IF EXISTS generate_order_number(UUID);

-- get_next_order_number: rewrite without tenant param
DROP FUNCTION IF EXISTS get_next_order_number(UUID);

CREATE OR REPLACE FUNCTION get_next_order_number()
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_next BIGINT;
BEGIN
  INSERT INTO order_number_counters (id, last_number)
  VALUES (1, 0)
  ON CONFLICT (id) DO NOTHING;

  UPDATE order_number_counters
  SET last_number = last_number + 1,
      updated_at = NOW()
  WHERE id = 1
  RETURNING last_number INTO v_next;

  RETURN '#ORD-' || LPAD(v_next::TEXT, 9, '0');
END;
$$;

GRANT EXECUTE ON FUNCTION get_next_order_number() TO authenticated;

-- Reporting functions: remove p_tenant_id param
CREATE OR REPLACE FUNCTION get_total_stock_value()
RETURNS DECIMAL AS $$
DECLARE
  v_total_stock_value DECIMAL;
BEGIN
  SELECT COALESCE(SUM(s.quantity * i.cost_per_unit), 0)
  INTO v_total_stock_value
  FROM stock s
  JOIN ingredients i ON s.ingredient_id = i.id;

  RETURN v_total_stock_value;
END;
$$ LANGUAGE plpgsql;

DROP FUNCTION IF EXISTS get_total_stock_value(UUID);

CREATE OR REPLACE FUNCTION get_net_profit_ytd()
RETURNS DECIMAL AS $$
DECLARE
  v_revenue DECIMAL;
  v_cogs DECIMAL;
  v_expenses DECIMAL;
BEGIN
  SELECT COALESCE(SUM(total_amount), 0) INTO v_revenue
  FROM sales
  WHERE DATE_TRUNC('year', sale_date) = DATE_TRUNC('year', CURRENT_DATE);

  SELECT COALESCE(SUM(ABS(sa.quantity) * i.cost_per_unit), 0) INTO v_cogs
  FROM stock_adjustments sa
  JOIN ingredients i ON sa.ingredient_id = i.id
  WHERE sa.adjustment_type = 'sale'
  AND DATE_TRUNC('year', sa.created_at) = DATE_TRUNC('year', CURRENT_DATE);

  SELECT COALESCE(SUM(amount), 0) INTO v_expenses
  FROM expenses
  WHERE DATE_TRUNC('year', expense_date) = DATE_TRUNC('year', CURRENT_DATE);

  RETURN COALESCE(v_revenue, 0) - COALESCE(v_cogs, 0) - COALESCE(v_expenses, 0);
END;
$$ LANGUAGE plpgsql;

DROP FUNCTION IF EXISTS get_net_profit_ytd(UUID);

CREATE OR REPLACE FUNCTION get_profit_loss(p_start_date DATE DEFAULT NULL, p_end_date DATE DEFAULT NULL)
RETURNS TABLE (
  period_start DATE,
  period_end DATE,
  revenue DECIMAL,
  cost_of_goods_sold DECIMAL,
  operating_expenses DECIMAL,
  gross_profit DECIMAL,
  net_profit DECIMAL
) AS $$
DECLARE
  v_start_date DATE := COALESCE(p_start_date, CURRENT_DATE - INTERVAL '30 days');
  v_end_date DATE := COALESCE(p_end_date, CURRENT_DATE);
BEGIN
  RETURN QUERY
  WITH revenue_data AS (
    SELECT COALESCE(SUM(total_amount), 0) AS total
    FROM sales
    WHERE sale_date BETWEEN v_start_date AND v_end_date
  ),
  cogs_data AS (
    SELECT COALESCE(SUM(ABS(sa.quantity) * i.cost_per_unit), 0) AS total
    FROM stock_adjustments sa
    JOIN ingredients i ON sa.ingredient_id = i.id
    WHERE sa.adjustment_type = 'sale'
    AND DATE(sa.created_at) BETWEEN v_start_date AND v_end_date
  ),
  expense_data AS (
    SELECT COALESCE(SUM(amount), 0) AS total
    FROM expenses
    WHERE expense_date BETWEEN v_start_date AND v_end_date
  )
  SELECT
    v_start_date AS period_start,
    v_end_date AS period_end,
    (SELECT total FROM revenue_data) AS revenue,
    (SELECT total FROM cogs_data) AS cost_of_goods_sold,
    (SELECT total FROM expense_data) AS operating_expenses,
    (SELECT total FROM revenue_data) - (SELECT total FROM cogs_data) AS gross_profit,
    (SELECT total FROM revenue_data) - (SELECT total FROM cogs_data) - (SELECT total FROM expense_data) AS net_profit;
END;
$$ LANGUAGE plpgsql;

DROP FUNCTION IF EXISTS get_profit_loss(UUID, DATE, DATE);

CREATE OR REPLACE FUNCTION get_menu_performance(p_days INTEGER DEFAULT 7)
RETURNS TABLE (
  menu_item_id UUID,
  menu_item_name VARCHAR,
  quantity_sold INTEGER,
  total_revenue DECIMAL,
  total_cost DECIMAL,
  total_margin DECIMAL,
  margin_percentage DECIMAL
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    mi.id AS menu_item_id,
    mi.name AS menu_item_name,
    COALESCE(SUM(si.quantity), 0) AS quantity_sold,
    COALESCE(SUM(si.quantity * mi.selling_price), 0) AS total_revenue,
    COALESCE(SUM(si.quantity * mi.total_cost), 0) AS total_cost,
    COALESCE(SUM(si.quantity * (mi.selling_price - mi.total_cost)), 0) AS total_margin,
    CASE
      WHEN COALESCE(SUM(si.quantity * mi.selling_price), 0) > 0
      THEN (COALESCE(SUM(si.quantity * (mi.selling_price - mi.total_cost)), 0) / COALESCE(SUM(si.quantity * mi.selling_price), 0)) * 100
      ELSE 0
    END AS margin_percentage
  FROM menu_items mi
  LEFT JOIN sale_items si ON mi.id = si.menu_item_id
  LEFT JOIN sales s ON si.sale_id = s.id
  WHERE (s.id IS NULL OR DATE(s.sale_date) >= CURRENT_DATE - (p_days || ' days')::INTERVAL)
  GROUP BY mi.id, mi.name, mi.selling_price, mi.total_cost
  ORDER BY quantity_sold DESC;
END;
$$ LANGUAGE plpgsql;

DROP FUNCTION IF EXISTS get_menu_performance(UUID, INTEGER);

CREATE OR REPLACE FUNCTION get_ingredient_cost_trends(p_start_date DATE DEFAULT NULL, p_end_date DATE DEFAULT NULL)
RETURNS TABLE (
  ingredient_id UUID,
  ingredient_name VARCHAR,
  unit VARCHAR,
  avg_cost_per_unit DECIMAL,
  total_purchased DECIMAL,
  last_cost_per_unit DECIMAL,
  cost_change_percentage DECIMAL
) AS $$
DECLARE
  v_start_date DATE := COALESCE(p_start_date, CURRENT_DATE - INTERVAL '30 days');
  v_end_date DATE := COALESCE(p_end_date, CURRENT_DATE);
BEGIN
  RETURN QUERY
  WITH purchase_data AS (
    SELECT
      pi.ingredient_id,
      pi.unit_price,
      pi.quantity
    FROM purchase_items pi
    JOIN purchases p ON pi.purchase_id = p.id
    WHERE p.invoice_date BETWEEN v_start_date AND v_end_date
  ),
  ingredient_stats AS (
    SELECT
      pd.ingredient_id,
      SUM(pd.quantity) as total_qty,
      SUM(pd.quantity * pd.unit_price) as total_cost
    FROM purchase_data pd
    GROUP BY pd.ingredient_id
  ),
  ingredient_data AS (
    SELECT
      i.id,
      i.name,
      i.unit,
      i.cost_per_unit AS current_cost
    FROM ingredients i
  )
  SELECT
    id.id AS ingredient_id,
    id.name AS ingredient_name,
    id.unit AS unit,
    CAST(COALESCE(
      CASE WHEN ps.total_qty > 0 THEN ps.total_cost / ps.total_qty ELSE id.current_cost END,
      id.current_cost
    ) AS DECIMAL) AS avg_cost_per_unit,
    CAST(COALESCE(ps.total_qty, 0) AS DECIMAL) AS total_purchased,
    id.current_cost AS last_cost_per_unit,
    CAST(CASE
      WHEN COALESCE(
        CASE WHEN ps.total_qty > 0 THEN ps.total_cost / ps.total_qty ELSE id.current_cost END,
        id.current_cost
      ) > 0
      THEN (
        (id.current_cost - COALESCE(
          CASE WHEN ps.total_qty > 0 THEN ps.total_cost / ps.total_qty ELSE id.current_cost END,
          id.current_cost
        ))
        /
        COALESCE(
          CASE WHEN ps.total_qty > 0 THEN ps.total_cost / ps.total_qty ELSE id.current_cost END,
          id.current_cost
        )
      ) * 100
      ELSE 0
    END AS DECIMAL) AS cost_change_percentage
  FROM ingredient_data id
  LEFT JOIN ingredient_stats ps ON id.id = ps.ingredient_id
  ORDER BY cost_change_percentage DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

DROP FUNCTION IF EXISTS get_ingredient_cost_trends(UUID, DATE, DATE);
DROP FUNCTION IF EXISTS get_ingredient_cost_trends(UUID, INTEGER);

-- save_sale_with_items: remove p_tenant_id param
CREATE OR REPLACE FUNCTION save_sale_with_items(
  p_sale_id uuid,
  p_order_number varchar,
  p_sale_type varchar,
  p_table_id uuid,
  p_total_amount numeric,
  p_payment_status varchar,
  p_payment_method varchar,
  p_payment_notes text,
  p_payment_data jsonb,
  p_notes text,
  p_customer_id uuid,
  p_discount_amount numeric,
  p_discount_name text,
  p_tax_amount numeric,
  p_sale_date date,
  p_sale_time timestamptz,
  p_created_by uuid,
  p_items jsonb
)
returns table (sale_id uuid, order_number varchar)
language plpgsql
as $$
declare
  v_sale_id uuid;
  v_order_number varchar;
begin
  if p_items is null or jsonb_array_length(p_items) = 0 then
    raise exception 'No items to save';
  end if;

  if p_sale_id is not null then
    update public.sales
    set total_amount = p_total_amount,
        payment_status = p_payment_status,
        payment_method = p_payment_method,
        payment_notes = p_payment_notes,
        payment_data = coalesce(p_payment_data, '{}'::jsonb),
        notes = p_notes,
        customer_id = p_customer_id,
        discount_amount = p_discount_amount,
        discount_name = p_discount_name,
        tax_amount = p_tax_amount,
        table_id = p_table_id,
        sale_type = p_sale_type
    where id = p_sale_id;

    delete from public.sale_items where sale_id = p_sale_id;

    insert into public.sale_items (sale_id, menu_item_id, quantity, unit_price, total_price, notes)
    select
      p_sale_id,
      (item->>'menu_item_id')::uuid,
      coalesce((item->>'quantity')::int, 0),
      coalesce((item->>'unit_price')::numeric, 0),
      coalesce(
        (item->>'total_price')::numeric,
        coalesce((item->>'unit_price')::numeric, 0) * coalesce((item->>'quantity')::numeric, 0)
      ),
      item->>'notes'
    from jsonb_array_elements(p_items) as item;

    select s.order_number into v_order_number
    from public.sales s
    where s.id = p_sale_id;

    return query select p_sale_id, v_order_number;
  else
    insert into public.sales as s (
      order_number,
      sale_type,
      table_id,
      total_amount,
      payment_status,
      payment_method,
      payment_notes,
      payment_data,
      notes,
      customer_id,
      discount_amount,
      discount_name,
      tax_amount,
      sale_date,
      sale_time,
      created_by
    ) values (
      p_order_number,
      p_sale_type,
      p_table_id,
      p_total_amount,
      p_payment_status,
      p_payment_method,
      p_payment_notes,
      coalesce(p_payment_data, '{}'::jsonb),
      p_notes,
      p_customer_id,
      p_discount_amount,
      p_discount_name,
      p_tax_amount,
      p_sale_date,
      p_sale_time,
      p_created_by
    )
    returning s.id, s.order_number into v_sale_id, v_order_number;

    insert into public.sale_items (sale_id, menu_item_id, quantity, unit_price, total_price, notes)
    select
      v_sale_id,
      (item->>'menu_item_id')::uuid,
      coalesce((item->>'quantity')::int, 0),
      coalesce((item->>'unit_price')::numeric, 0),
      coalesce(
        (item->>'total_price')::numeric,
        coalesce((item->>'unit_price')::numeric, 0) * coalesce((item->>'quantity')::numeric, 0)
      ),
      item->>'notes'
    from jsonb_array_elements(p_items) as item;

    return query select v_sale_id, v_order_number;
  end if;
end;
$$;

-- Drop old version with tenant param
DROP FUNCTION IF EXISTS save_sale_with_items(uuid, uuid, varchar, varchar, uuid, numeric, varchar, varchar, text, jsonb, text, uuid, numeric, text, numeric, date, timestamptz, uuid, jsonb);

-- handle_new_user trigger: remove tenant_id from INSERT
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.users (
    id,
    email,
    full_name,
    role,
    status
  )
  VALUES (
    NEW.id,
    NEW.email,
    NEW.raw_user_meta_data->>'full_name',
    COALESCE(NEW.raw_user_meta_data->>'role', 'staff'),
    COALESCE(NEW.raw_user_meta_data->>'status', 'active')
  );

  RETURN NEW;
END;
$$;

-- update_stock_on_purchase: remove tenant_id reference
CREATE OR REPLACE FUNCTION update_stock_on_purchase()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO stock (
    ingredient_id, location_id, quantity
  )
  SELECT
    pi.ingredient_id,
    pi.location_id,
    pi.quantity
  FROM purchase_items pi
  WHERE pi.purchase_id = NEW.id
  ON CONFLICT (ingredient_id, location_id)
  DO UPDATE SET
    quantity = stock.quantity + EXCLUDED.quantity,
    last_updated = NOW();

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- update_stock_from_purchase_item: remove tenant_id
CREATE OR REPLACE FUNCTION update_stock_from_purchase_item()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO stock (
    ingredient_id, location_id, quantity
  )
  VALUES (
    NEW.ingredient_id,
    NEW.location_id,
    NEW.quantity
  )
  ON CONFLICT (ingredient_id, location_id)
  DO UPDATE SET
    quantity = stock.quantity + EXCLUDED.quantity,
    last_updated = NOW();

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- update_stock_on_sale: remove tenant_id references
CREATE OR REPLACE FUNCTION update_stock_on_sale()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO stock_adjustments (
    ingredient_id, location_id, adjustment_type, quantity, reference_id, created_by
  )
  SELECT
    ri.ingredient_id,
    (SELECT id FROM locations LIMIT 1),
    'sale',
    (ri.quantity * si.quantity) * -1,
    si.id,
    NEW.created_by
  FROM sale_items si
  JOIN menu_items mi ON si.menu_item_id = mi.id
  JOIN recipe_items ri ON mi.id = ri.menu_item_id
  WHERE si.sale_id = NEW.id;

  UPDATE stock s
  SET quantity = s.quantity + (
    SELECT (ri.quantity * si.quantity) * -1
    FROM sale_items si
    JOIN recipe_items ri ON si.menu_item_id = ri.menu_item_id
    WHERE si.sale_id = NEW.id AND ri.ingredient_id = s.ingredient_id
  ),
  last_updated = NOW()
  WHERE s.ingredient_id IN (
    SELECT ri.ingredient_id
    FROM sale_items si
    JOIN recipe_items ri ON si.menu_item_id = ri.menu_item_id
    WHERE si.sale_id = NEW.id
  );

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- create_kds_order_from_sale: remove tenant_id
CREATE OR REPLACE FUNCTION create_kds_order_from_sale()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO kds_orders (
    sale_id, order_number, priority
  )
  VALUES (
    NEW.id,
    NEW.order_number,
    'normal'
  );

  INSERT INTO kds_order_items (kds_order_id, menu_item_id, quantity, notes)
  SELECT
    (SELECT id FROM kds_orders WHERE sale_id = NEW.id),
    menu_item_id,
    quantity,
    notes
  FROM sale_items
  WHERE sale_id = NEW.id;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- log_sale_history: remove tenant_id reference
CREATE OR REPLACE FUNCTION log_sale_history()
RETURNS TRIGGER AS $$
DECLARE
  v_action text;
  v_details jsonb;
BEGIN
  IF (TG_OP = 'INSERT') THEN
    v_action := 'created';
    v_details := jsonb_build_object('new', row_to_json(NEW));
  ELSIF (TG_OP = 'DELETE') THEN
    v_action := 'deleted';
    v_details := jsonb_build_object('old', row_to_json(OLD));
  ELSE
    IF NEW.payment_status = 'refunded' AND OLD.payment_status <> 'refunded' THEN
      v_action := 'refunded';
    ELSE
      v_action := 'updated';
    END IF;
    v_details := jsonb_build_object('old', row_to_json(OLD), 'new', row_to_json(NEW));
  END IF;

  INSERT INTO sale_history (sale_id, action, details, created_by)
  VALUES (
    COALESCE(NEW.id, OLD.id),
    v_action,
    v_details,
    auth.uid()
  );

  IF (TG_OP = 'DELETE') THEN
    RETURN OLD;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

COMMIT;
