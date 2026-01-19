DROP POLICY IF EXISTS "Staff can insert stock" ON stock;
CREATE POLICY "Staff can insert stock"
  ON stock FOR INSERT
  WITH CHECK (
    tenant_id IN (SELECT tenant_id FROM users WHERE id = auth.uid())
    AND EXISTS (
      SELECT 1 FROM users WHERE id = auth.uid() AND role IN ('owner', 'manager', 'staff')
    )
  );

DROP POLICY IF EXISTS "Staff can update stock" ON stock;
CREATE POLICY "Staff can update stock"
  ON stock FOR UPDATE
  USING (
    tenant_id IN (SELECT tenant_id FROM users WHERE id = auth.uid())
    AND EXISTS (
      SELECT 1 FROM users WHERE id = auth.uid() AND role IN ('owner', 'manager', 'staff')
    )
  );

DROP POLICY IF EXISTS "Users can create stocktake items" ON stocktake_items;
CREATE POLICY "Users can create stocktake items"
  ON stocktake_items FOR INSERT
  WITH CHECK (
    stocktake_id IN (
      SELECT id FROM stocktakes 
      WHERE tenant_id IN (SELECT tenant_id FROM users WHERE id = auth.uid())
    )
    AND EXISTS (
      SELECT 1 FROM users WHERE id = auth.uid() AND role IN ('owner', 'manager', 'staff')
    )
  );

DROP POLICY IF EXISTS "Users can view stocktake items" ON stocktake_items;
CREATE POLICY "Users can view stocktake items"
  ON stocktake_items FOR SELECT
  USING (
    stocktake_id IN (
      SELECT id FROM stocktakes 
      WHERE tenant_id IN (SELECT tenant_id FROM users WHERE id = auth.uid())
    )
  );
