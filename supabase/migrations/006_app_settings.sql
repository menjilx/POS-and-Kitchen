-- App Settings Migration
-- Migration: 006_app_settings.sql
-- Description: Adds app settings table and functions for managing application configuration

-- Create App Settings Table
CREATE TABLE IF NOT EXISTS app_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  key VARCHAR(255) UNIQUE NOT NULL,
  value TEXT,
  value_type VARCHAR(50) DEFAULT 'string',
  description VARCHAR(500),
  category VARCHAR(100) NOT NULL,
  options JSONB,
  is_encrypted BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS for App Settings
ALTER TABLE app_settings ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Superadmins can manage all settings
CREATE POLICY "Superadmins can manage all settings"
  ON app_settings FOR ALL
  USING (EXISTS (SELECT 1 FROM super_admins WHERE user_id = auth.uid()));

-- Seed Default Settings
INSERT INTO app_settings (key, value, value_type, description, category, options) VALUES
-- General Settings
('app_name', 'Kitchen System', 'string', 'Application name displayed in UI', 'general', NULL),
('timezone', 'UTC', 'string', 'Default timezone for the application', 'general', 
  '{"options": ["UTC", "America/New_York", "America/Los_Angeles", "America/Chicago", "Europe/London", "Europe/Paris", "Asia/Tokyo", "Asia/Singapore", "Australia/Sydney"]}'),
('date_format', 'YYYY-MM-DD', 'string', 'Date display format', 'general',
  '{"options": ["YYYY-MM-DD", "MM/DD/YYYY", "DD/MM/YYYY", "YYYY/MM/DD"]}'),
('time_format', '24h', 'string', 'Time display format', 'general',
  '{"options": ["12h", "24h"]}'),
('language', 'en', 'string', 'Default language', 'general',
  '{"options": ["en", "es", "fr", "de", "zh", "ja", "ko"]}'),

-- Business Settings
('currency', 'USD', 'string', 'Default currency', 'business',
  '{"options": ["USD", "EUR", "GBP", "JPY", "CNY", "CAD", "AUD", "SGD", "INR", "KRW"]}'),
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

-- Security Settings
('session_timeout', '60', 'number', 'Session timeout in minutes', 'security', NULL),
('password_min_length', '8', 'number', 'Minimum password length', 'security', NULL),
('password_require_uppercase', 'true', 'boolean', 'Require uppercase letter', 'security', NULL),
('password_require_number', 'true', 'boolean', 'Require number', 'security', NULL),
('password_require_special', 'false', 'boolean', 'Require special character', 'security', NULL),
('max_login_attempts', '5', 'number', 'Max failed login attempts before lockout', 'security', NULL),
('lockout_duration', '15', 'number', 'Account lockout duration in minutes', 'security', NULL)
ON CONFLICT (key) DO UPDATE SET
  value = EXCLUDED.value,
  value_type = EXCLUDED.value_type,
  description = EXCLUDED.description,
  category = EXCLUDED.category,
  options = EXCLUDED.options,
  updated_at = NOW();

-- Get all settings (superadmin only)
CREATE OR REPLACE FUNCTION get_all_settings()
RETURNS JSONB AS $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM super_admins WHERE user_id = auth.uid()) THEN
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

-- Get single setting
CREATE OR REPLACE FUNCTION get_app_setting(p_key VARCHAR)
RETURNS JSONB AS $$
BEGIN
  RETURN (
    SELECT jsonb_build_object(
      'value', value,
      'value_type', value_type,
      'description', description,
      'category', category,
      'options', options
    )
    FROM app_settings
    WHERE key = p_key
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Update setting (superadmin only)
CREATE OR REPLACE FUNCTION update_app_setting(
  p_key VARCHAR,
  p_value TEXT
) RETURNS BOOLEAN AS $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM super_admins WHERE user_id = auth.uid()) THEN
    RAISE EXCEPTION 'Access denied: Superadmin privileges required';
  END IF;
  
  UPDATE app_settings
  SET value = p_value, updated_at = NOW()
  WHERE key = p_key;
  
  RETURN FOUND;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Bulk update settings
CREATE OR REPLACE FUNCTION bulk_update_settings(p_settings JSONB)
RETURNS BOOLEAN AS $$
DECLARE
  key_text TEXT;
  value_text TEXT;
BEGIN
  IF NOT EXISTS (SELECT 1 FROM super_admins WHERE user_id = auth.uid()) THEN
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

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_app_settings_category ON app_settings(category);
CREATE INDEX IF NOT EXISTS idx_app_settings_key ON app_settings(key);
