-- ============================================
-- SUPER ADMIN FEATURE - Minimal Version
-- ============================================

-- Update users role check constraint to include superadmin
ALTER TABLE users DROP CONSTRAINT IF EXISTS users_role_check;
ALTER TABLE users ADD CONSTRAINT users_role_check 
  CHECK (role IN ('owner', 'manager', 'staff', 'superadmin'));

-- Create super_admins table for managing global admins
CREATE TABLE IF NOT EXISTS super_admins (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  email VARCHAR(255) NOT NULL UNIQUE,
  full_name VARCHAR(255),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id)
);

-- Add is_suspended column to tenants for superadmin control
ALTER TABLE tenants ADD COLUMN IF NOT EXISTS is_suspended BOOLEAN DEFAULT FALSE;
ALTER TABLE tenants ADD COLUMN IF NOT EXISTS suspension_reason TEXT;
ALTER TABLE tenants ADD COLUMN IF NOT EXISTS suspended_at TIMESTAMPTZ;

-- ============================================
-- HELPER FUNCTIONS
-- ============================================

-- Function to get current user's tenant_id (regular users) or NULL for superadmin
CREATE OR REPLACE FUNCTION get_current_tenant_id()
RETURNS UUID AS $$
BEGIN
  -- Superadmins return NULL (they can access all tenants)
  IF EXISTS (SELECT 1 FROM super_admins WHERE user_id = auth.uid()) THEN
    RETURN NULL;
  END IF;
  
  -- Regular users return their tenant_id
  RETURN (SELECT tenant_id FROM users WHERE id = auth.uid());
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to check if current user is superadmin
CREATE OR REPLACE FUNCTION is_superadmin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM super_admins 
    WHERE user_id = auth.uid()
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- SUPER ADMIN FUNCTIONS
-- ============================================

-- Function to get all tenants with stats
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
  RETURN QUERY
  SELECT 
    t.id,
    t.name,
    t.email,
    COUNT(DISTINCT u.id) as user_count,
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

-- Function to suspend tenant
CREATE OR REPLACE FUNCTION suspend_tenant(p_tenant_id UUID, p_reason TEXT)
RETURNS VOID AS $$
BEGIN
  UPDATE tenants 
  SET is_suspended = TRUE,
    suspension_reason = p_reason,
    suspended_at = NOW()
  WHERE id = p_tenant_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to reactivate tenant
CREATE OR REPLACE FUNCTION reactivate_tenant(p_tenant_id UUID)
RETURNS VOID AS $$
BEGIN
  UPDATE tenants 
  SET is_suspended = FALSE,
    suspension_reason = NULL,
    suspended_at = NULL
  WHERE id = p_tenant_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to delete tenant
CREATE OR REPLACE FUNCTION delete_tenant(p_tenant_id UUID)
RETURNS VOID AS $$
BEGIN
  -- CASCADE will delete all related data
  DELETE FROM tenants WHERE id = p_tenant_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- INITIAL SUPERADMIN
-- ============================================

-- To create initial superadmin, run this manually in Supabase SQL Editor:
-- INSERT INTO super_admins (user_id, email, full_name, created_by)
-- SELECT 
--   auth.uid(), 
--   'admin@yourdomain.com', 
--   'Super Admin',
--   (SELECT id FROM auth.users WHERE email = 'your-signup-email@example.com' LIMIT 1);
