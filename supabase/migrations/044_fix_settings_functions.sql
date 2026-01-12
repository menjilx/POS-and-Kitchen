-- Fix app settings functions to use is_superadmin() check instead of dropped super_admins table
-- And secure tenant management functions

-- 1. Update get_all_settings
CREATE OR REPLACE FUNCTION get_all_settings()
RETURNS JSONB AS $$
BEGIN
  IF NOT is_superadmin() THEN
    RAISE EXCEPTION 'Access denied: Superadmin privileges required';
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

-- 2. Update update_app_setting
CREATE OR REPLACE FUNCTION update_app_setting(
  p_key VARCHAR,
  p_value TEXT
) RETURNS BOOLEAN AS $$
BEGIN
  IF NOT is_superadmin() THEN
    RAISE EXCEPTION 'Access denied: Superadmin privileges required';
  END IF;
  
  UPDATE app_settings
  SET value = p_value, updated_at = NOW()
  WHERE key = p_key;
  
  RETURN FOUND;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. Update bulk_update_settings
CREATE OR REPLACE FUNCTION bulk_update_settings(p_settings JSONB)
RETURNS BOOLEAN AS $$
DECLARE
  key_text TEXT;
  value_text TEXT;
BEGIN
  IF NOT is_superadmin() THEN
    RAISE EXCEPTION 'Access denied: Superadmin privileges required';
  END IF;
  
  FOR key_text, value_text IN SELECT * FROM jsonb_each(p_settings)
  LOOP
    UPDATE app_settings
    SET value = value_text, updated_at = NOW()
    WHERE key = key_text;
  END LOOP;
  
  RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4. Secure tenant functions
CREATE OR REPLACE FUNCTION get_all_tenants()
RETURNS TABLE (
  id UUID,
  name VARCHAR,
  email VARCHAR,
  user_count INTEGER,
  total_sales DECIMAL,
  is_suspended BOOLEAN,
  created_at TIMESTAMPTZ
) AS $$
BEGIN
  IF NOT is_superadmin() THEN
    RAISE EXCEPTION 'Access denied: Superadmin privileges required';
  END IF;

  RETURN QUERY
  SELECT 
    t.id,
    t.name,
    t.email,
    CAST(COUNT(DISTINCT u.id) AS INTEGER) as user_count,
    COALESCE(SUM(s.total_amount), 0) as total_sales,
    t.is_suspended,
    t.created_at
  FROM tenants t
  LEFT JOIN users u ON t.id = u.tenant_id
  LEFT JOIN sales s ON t.id = s.tenant_id
  GROUP BY t.id, t.name, t.email, t.is_suspended, t.created_at
  ORDER BY t.created_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION suspend_tenant(p_tenant_id UUID, p_reason TEXT)
RETURNS VOID AS $$
BEGIN
  IF NOT is_superadmin() THEN
    RAISE EXCEPTION 'Access denied: Superadmin privileges required';
  END IF;

  UPDATE tenants 
  SET is_suspended = TRUE,
    suspension_reason = p_reason,
    suspended_at = NOW()
  WHERE id = p_tenant_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION reactivate_tenant(p_tenant_id UUID)
RETURNS VOID AS $$
BEGIN
  IF NOT is_superadmin() THEN
    RAISE EXCEPTION 'Access denied: Superadmin privileges required';
  END IF;

  UPDATE tenants 
  SET is_suspended = FALSE,
    suspension_reason = NULL,
    suspended_at = NULL
  WHERE id = p_tenant_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION delete_tenant(p_tenant_id UUID)
RETURNS VOID AS $$
BEGIN
  IF NOT is_superadmin() THEN
    RAISE EXCEPTION 'Access denied: Superadmin privileges required';
  END IF;

  DELETE FROM tenants WHERE id = p_tenant_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
