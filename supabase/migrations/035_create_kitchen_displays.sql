CREATE TABLE IF NOT EXISTS kitchen_displays (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  name VARCHAR(100) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(tenant_id, name)
);

-- Enable RLS
ALTER TABLE kitchen_displays ENABLE ROW LEVEL SECURITY;

-- Policies
-- Drop existing policies to ensure idempotency
DROP POLICY IF EXISTS "Users can view kitchen displays" ON kitchen_displays;
DROP POLICY IF EXISTS "Owners and Managers can manage kitchen displays" ON kitchen_displays;

CREATE POLICY "Users can view kitchen displays" 
  ON kitchen_displays FOR SELECT 
  USING (tenant_id IN (SELECT tenant_id FROM users WHERE id = auth.uid()));

CREATE POLICY "Owners and Managers can manage kitchen displays" 
  ON kitchen_displays FOR ALL 
  USING (
    tenant_id IN (SELECT tenant_id FROM users WHERE id = auth.uid()) 
    AND EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role IN ('owner', 'manager'))
  );
