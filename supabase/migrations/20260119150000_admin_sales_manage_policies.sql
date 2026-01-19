-- Allow owners and managers to update or delete sales

DROP POLICY IF EXISTS "Owners and managers can update sales" ON sales;
DROP POLICY IF EXISTS "Owners and managers can delete sales" ON sales;

CREATE POLICY "Owners and managers can update sales"
  ON sales FOR UPDATE
  USING (
    tenant_id IN (SELECT tenant_id FROM users WHERE id = auth.uid())
    AND EXISTS (
      SELECT 1 FROM users WHERE id = auth.uid() AND role IN ('owner', 'manager')
    )
  );

CREATE POLICY "Owners and managers can delete sales"
  ON sales FOR DELETE
  USING (
    tenant_id IN (SELECT tenant_id FROM users WHERE id = auth.uid())
    AND EXISTS (
      SELECT 1 FROM users WHERE id = auth.uid() AND role IN ('owner', 'manager')
    )
  );
