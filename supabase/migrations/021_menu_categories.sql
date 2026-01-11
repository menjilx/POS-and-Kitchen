
-- ============================================
-- MENU CATEGORIES
-- ============================================
CREATE TABLE menu_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  name VARCHAR(100) NOT NULL,
  description TEXT,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(tenant_id, name)
);

-- Enable RLS
ALTER TABLE menu_categories ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Users can view menu categories of their tenant" ON menu_categories
  FOR SELECT USING (tenant_id = (SELECT tenant_id FROM users WHERE id = auth.uid()));
  
CREATE POLICY "Users can insert menu categories for their tenant" ON menu_categories
  FOR INSERT WITH CHECK (tenant_id = (SELECT tenant_id FROM users WHERE id = auth.uid()));
  
CREATE POLICY "Users can update menu categories of their tenant" ON menu_categories
  FOR UPDATE USING (tenant_id = (SELECT tenant_id FROM users WHERE id = auth.uid()));
  
CREATE POLICY "Users can delete menu categories of their tenant" ON menu_categories
  FOR DELETE USING (tenant_id = (SELECT tenant_id FROM users WHERE id = auth.uid()));

-- Add Indexes
CREATE INDEX idx_menu_categories_tenant ON menu_categories(tenant_id);
