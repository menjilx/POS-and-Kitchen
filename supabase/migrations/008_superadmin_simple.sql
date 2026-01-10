-- ============================================
-- SYSTEM SETTINGS FOR SUPERADMIN
-- ============================================

-- Create system_settings table for storing configuration
CREATE TABLE IF NOT EXISTS system_settings (
  key VARCHAR(255) PRIMARY KEY,
  value TEXT,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Insert secret code for superadmin signup
INSERT INTO system_settings (key, value, description)
VALUES ('KITCHEN-SUPERADMIN-2024', 'kitchen_super_admin_2024', 'Secret code for superadmin signup')
ON CONFLICT (key) DO UPDATE SET 
  value = EXCLUDED.value,
  updated_at = NOW();

-- ============================================
-- HELPER FUNCTION FOR SUPERADMIN
-- ============================================

-- Function to check if user is superadmin via metadata
CREATE OR REPLACE FUNCTION is_superadmin()
RETURNS BOOLEAN AS $$
DECLARE
  v_meta_data JSONB;
BEGIN
  -- Get user metadata from raw_user_meta_data
  v_meta_data := raw_user_meta_data::JSONB;
  
  -- Check for superadmin flag
  RETURN v_meta_data ?->>'superadmin' = true OR v_meta_data ?->>'role' = 'superadmin';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
