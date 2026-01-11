-- Create purchase_attachments table
CREATE TABLE IF NOT EXISTS purchase_attachments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  purchase_id UUID NOT NULL REFERENCES purchases(id) ON DELETE CASCADE,
  file_name TEXT NOT NULL,
  file_url TEXT NOT NULL,
  file_type TEXT,
  file_size BIGINT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE purchase_attachments ENABLE ROW LEVEL SECURITY;

-- Create policies (mirroring purchases policies)
CREATE POLICY "Users can view purchase attachments in their tenant"
  ON purchase_attachments FOR SELECT
  USING (
    purchase_id IN (
      SELECT id FROM purchases 
      WHERE tenant_id IN (SELECT tenant_id FROM users WHERE id = auth.uid())
    )
  );

CREATE POLICY "Users can create purchase attachments"
  ON purchase_attachments FOR INSERT
  WITH CHECK (
    purchase_id IN (
      SELECT id FROM purchases 
      WHERE tenant_id IN (SELECT tenant_id FROM users WHERE id = auth.uid())
    )
  );

CREATE POLICY "Owners and managers can delete purchase attachments"
  ON purchase_attachments FOR DELETE
  USING (
    purchase_id IN (
      SELECT id FROM purchases 
      WHERE tenant_id IN (SELECT tenant_id FROM users WHERE id = auth.uid())
    )
    AND EXISTS (
      SELECT 1 FROM users WHERE id = auth.uid() AND role IN ('owner', 'manager')
    )
  );
