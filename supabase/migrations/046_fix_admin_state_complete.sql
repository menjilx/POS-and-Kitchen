-- FIX ADMIN STATE COMPLETE
-- This migration ensures that:
-- 1. All necessary Admin RPC functions exist and are secure
-- 2. The app_settings table is fully populated
-- 3. Corrections to settings categories are applied (Currency -> General)
-- 4. Expanded Timezone and Currency lists
-- 5. FIXED: bulk_update_settings uses jsonb_each_text
-- 6. FIXED: Broken RLS policy on app_settings is replaced

-- ==========================================
-- 0. FIX BROKEN RLS POLICY
-- ==========================================

-- Drop the old policy that referenced the deleted super_admins table
DROP POLICY IF EXISTS "Superadmins can manage all settings" ON app_settings;

-- Create new policy using the correct function
CREATE POLICY "Superadmins can manage all settings"
  ON app_settings FOR ALL
  USING (is_superadmin());

-- Ensure RLS is enabled
ALTER TABLE app_settings ENABLE ROW LEVEL SECURITY;


-- ==========================================
-- 1. SECURE FUNCTIONS (Re-applying from 044)
-- ==========================================

-- Function: get_all_settings
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

-- Function: update_app_setting
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

-- Function: bulk_update_settings
CREATE OR REPLACE FUNCTION bulk_update_settings(p_settings JSONB)
RETURNS BOOLEAN AS $$
DECLARE
  key_text TEXT;
  value_text TEXT;
BEGIN
  IF NOT is_superadmin() THEN
    RAISE EXCEPTION 'Access denied: Superadmin privileges required';
  END IF;
  
  -- FIXED: Using jsonb_each_text instead of jsonb_each to properly unquote string values
  FOR key_text, value_text IN SELECT * FROM jsonb_each_text(p_settings)
  LOOP
    UPDATE app_settings
    SET value = value_text, updated_at = NOW()
    WHERE key = key_text;
  END LOOP;
  
  RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function: get_all_tenants
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

-- ==========================================
-- 2. SEED APP SETTINGS (Complete List)
-- ==========================================

INSERT INTO app_settings (key, value, value_type, description, category, options) VALUES
-- General Settings (Timezone & Currency Moved Here)
('app_name', 'Kitchen System', 'string', 'Application name displayed in UI', 'general', NULL),
('timezone', 'UTC', 'string', 'Default timezone for the application', 'general', 
  '{"options": ["UTC", "Africa/Cairo", "Africa/Johannesburg", "Africa/Lagos", "America/Anchorage", "America/Argentina/Buenos_Aires", "America/Bogota", "America/Caracas", "America/Chicago", "America/Denver", "America/Los_Angeles", "America/Mexico_City", "America/New_York", "America/Phoenix", "America/Sao_Paulo", "America/Toronto", "America/Vancouver", "Asia/Bangkok", "Asia/Dubai", "Asia/Hong_Kong", "Asia/Jakarta", "Asia/Kolkata", "Asia/Kuala_Lumpur", "Asia/Manila", "Asia/Riyadh", "Asia/Seoul", "Asia/Shanghai", "Asia/Singapore", "Asia/Taipei", "Asia/Tokyo", "Australia/Adelaide", "Australia/Brisbane", "Australia/Melbourne", "Australia/Perth", "Australia/Sydney", "Europe/Amsterdam", "Europe/Athens", "Europe/Berlin", "Europe/Brussels", "Europe/Budapest", "Europe/Copenhagen", "Europe/Dublin", "Europe/Helsinki", "Europe/Istanbul", "Europe/Lisbon", "Europe/London", "Europe/Madrid", "Europe/Moscow", "Europe/Oslo", "Europe/Paris", "Europe/Prague", "Europe/Rome", "Europe/Stockholm", "Europe/Vienna", "Europe/Warsaw", "Europe/Zurich", "Pacific/Auckland", "Pacific/Fiji", "Pacific/Honolulu"]}'),
('date_format', 'YYYY-MM-DD', 'string', 'Date display format', 'general',
  '{"options": ["YYYY-MM-DD", "MM/DD/YYYY", "DD/MM/YYYY", "YYYY/MM/DD"]}'),
('time_format', '24h', 'string', 'Time display format', 'general',
  '{"options": ["12h", "24h"]}'),
('language', 'en', 'string', 'Default language', 'general',
  '{"options": ["en", "es", "fr", "de", "zh", "ja", "ko"]}'),
('currency', 'USD', 'string', 'Default currency', 'general',
  '{"options": ["USD", "AED", "ARS", "AUD", "BRL", "CAD", "CHF", "CLP", "CNY", "COP", "CZK", "DKK", "EGP", "EUR", "GBP", "HKD", "HUF", "IDR", "ILS", "INR", "JPY", "KRW", "MXN", "MYR", "NGN", "NOK", "NZD", "PHP", "PKR", "PLN", "RUB", "SAR", "SEK", "SGD", "THB", "TRY", "TWD", "UAH", "VND", "ZAR"]}'),

-- Business Settings
('tax_rate', '0', 'number', 'Default tax rate percentage', 'business', NULL),
('low_stock_threshold', '10', 'number', 'Default low stock alert threshold', 'business', NULL),
('currency_symbol_position', 'before', 'string', 'Position of currency symbol', 'business',
  '{"options": ["before", "after"]}'),

-- Restaurant Settings
('opening_time', '08:00', 'string', 'Default opening time', 'restaurant', NULL),
('closing_time', '22:00', 'string', 'Default closing time', 'restaurant', NULL),
('reservation_duration', '90', 'number', 'Default reservation duration in minutes', 'restaurant', NULL),
('max_party_size', '10', 'number', 'Maximum party size for reservations', 'restaurant', NULL),
('table_prefix', 'T', 'string', 'Prefix for table names', 'restaurant', NULL),

-- KDS Settings
('kds_order_timeout', '30', 'number', 'Order timeout alert in minutes', 'kds',
  '{"unit": "minutes"}'),
('kds_auto_refresh', '30', 'number', 'Auto-refresh interval in seconds', 'kds', NULL),
('kds_show_completed', 'true', 'boolean', 'Show completed orders in KDS', 'kds', NULL),
('kds_completed_duration', '60', 'number', 'Show completed orders for (seconds)', 'kds', NULL),

-- Notification Settings
('email_notifications', 'true', 'boolean', 'Enable email notifications', 'notifications', NULL),
('low_stock_alerts', 'true', 'boolean', 'Enable low stock email alerts', 'notifications', NULL),
('order_alerts', 'true', 'boolean', 'Enable new order email alerts', 'notifications', NULL),
('daily_sales_report', 'false', 'boolean', 'Enable daily sales report email', 'notifications', NULL),
('report_recipient_email', '', 'string', 'Email for sales reports', 'notifications', NULL),

-- SMTP Settings
('smtp_host', '', 'string', 'SMTP server host', 'smtp', NULL),
('smtp_port', '587', 'number', 'SMTP server port', 'smtp', NULL),
('smtp_user', '', 'string', 'SMTP username', 'smtp', NULL),
('smtp_password', '', 'string', 'SMTP password', 'smtp', '{"is_encrypted": true}'),
('smtp_from_email', '', 'string', 'From email address', 'smtp', NULL),
('smtp_from_name', '', 'string', 'From display name', 'smtp', NULL),
('smtp_secure', 'true', 'boolean', 'Use TLS/SSL for SMTP', 'smtp', NULL),

-- SMS Settings
('sms_provider', 'twilio', 'string', 'SMS Provider', 'sms', '{"options": ["twilio", "sns", "nexmo"]}'),
('sms_account_sid', '', 'string', 'Account SID / API Key', 'sms', NULL),
('sms_auth_token', '', 'string', 'Auth Token / Secret', 'sms', '{"is_encrypted": true}'),
('sms_from_number', '', 'string', 'From Phone Number', 'sms', NULL),

-- Security Settings
('session_timeout', '60', 'number', 'Session timeout in minutes', 'security', NULL),
('password_min_length', '8', 'number', 'Minimum password length', 'security', NULL),
('password_require_uppercase', 'true', 'boolean', 'Require uppercase letter', 'security', NULL),
('password_require_number', 'true', 'boolean', 'Require number', 'security', NULL),
('password_require_special', 'false', 'boolean', 'Require special character', 'security', NULL),
('max_login_attempts', '5', 'number', 'Max failed login attempts before lockout', 'security', NULL),
('lockout_duration', '15', 'number', 'Account lockout duration in minutes', 'security', NULL),
('mfa_enforced', 'false', 'boolean', 'Enforce Multi-Factor Authentication', 'security', NULL),
('password_expiry_days', '90', 'number', 'Password expiration in days (0 to disable)', 'security', NULL)

ON CONFLICT (key) DO UPDATE SET
  value = EXCLUDED.value,
  value_type = EXCLUDED.value_type,
  description = EXCLUDED.description,
  category = EXCLUDED.category, -- This ensures 'currency' moves to 'general'
  options = EXCLUDED.options,
  updated_at = NOW();
