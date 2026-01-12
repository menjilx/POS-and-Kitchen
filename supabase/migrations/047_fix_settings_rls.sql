-- Fix broken RLS policy on app_settings
DROP POLICY IF EXISTS "Superadmins can manage all settings" ON app_settings;

CREATE POLICY "Superadmins can manage all settings"
  ON app_settings FOR ALL
  USING (is_superadmin());

ALTER TABLE app_settings ENABLE ROW LEVEL SECURITY;

-- Fix bulk_update_settings to properly handle string values (preventing extra quotes)
CREATE OR REPLACE FUNCTION bulk_update_settings(p_settings JSONB)
RETURNS BOOLEAN AS $$
DECLARE
  key_text TEXT;
  value_text TEXT;
BEGIN
  IF NOT is_superadmin() THEN
    RAISE EXCEPTION 'Access denied: Superadmin privileges required';
  END IF;
  
  -- Using jsonb_each_text ensures values are extracted as raw text, not JSON strings
  FOR key_text, value_text IN SELECT * FROM jsonb_each_text(p_settings)
  LOOP
    UPDATE app_settings
    SET value = value_text, updated_at = NOW()
    WHERE key = key_text;
  END LOOP;
  
  RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
