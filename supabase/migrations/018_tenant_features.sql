-- Add settings to tenants table
ALTER TABLE tenants 
ADD COLUMN IF NOT EXISTS settings JSONB DEFAULT '{
  "currency": "USD", 
  "timezone": "UTC",
  "tax_rate": 0
}'::jsonb;

-- Create kitchen_displays table
CREATE TABLE IF NOT EXISTS kitchen_displays (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  name VARCHAR(100) NOT NULL,
  token UUID DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(tenant_id, name)
);

-- Enable RLS
ALTER TABLE kitchen_displays ENABLE ROW LEVEL SECURITY;

-- Policies for kitchen_displays
CREATE POLICY "Users can view their tenant's kitchen displays"
  ON kitchen_displays FOR SELECT
  USING (
    tenant_id IN (
      SELECT tenant_id FROM users WHERE id = auth.uid()
    )
  );

CREATE POLICY "Users can insert kitchen displays for their tenant"
  ON kitchen_displays FOR INSERT
  WITH CHECK (
    tenant_id IN (
      SELECT tenant_id FROM users WHERE id = auth.uid()
    )
  );

CREATE POLICY "Users can update their tenant's kitchen displays"
  ON kitchen_displays FOR UPDATE
  USING (
    tenant_id IN (
      SELECT tenant_id FROM users WHERE id = auth.uid()
    )
  );

CREATE POLICY "Users can delete their tenant's kitchen displays"
  ON kitchen_displays FOR DELETE
  USING (
    tenant_id IN (
      SELECT tenant_id FROM users WHERE id = auth.uid()
    )
  );
