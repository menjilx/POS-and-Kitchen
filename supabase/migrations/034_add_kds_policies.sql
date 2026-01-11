-- Enable RLS permissions for KDS tables
-- This is needed because the initial policies only allowed SELECT and UPDATE, but not INSERT or DELETE

-- KDS ORDERS
CREATE POLICY "Users can create KDS orders"
  ON kds_orders FOR INSERT
  WITH CHECK (
    tenant_id IN (SELECT tenant_id FROM users WHERE id = auth.uid())
    AND EXISTS (
      SELECT 1 FROM users WHERE id = auth.uid() AND role IN ('owner', 'manager', 'staff')
    )
  );

CREATE POLICY "Users can delete KDS orders"
  ON kds_orders FOR DELETE
  USING (
    tenant_id IN (SELECT tenant_id FROM users WHERE id = auth.uid())
    AND EXISTS (
      SELECT 1 FROM users WHERE id = auth.uid() AND role IN ('owner', 'manager')
    )
  );

-- KDS ORDER ITEMS
CREATE POLICY "Users can create KDS order items"
  ON kds_order_items FOR INSERT
  WITH CHECK (
    kds_order_id IN (
      SELECT id FROM kds_orders 
      WHERE tenant_id IN (SELECT tenant_id FROM users WHERE id = auth.uid())
    )
  );

CREATE POLICY "Users can update KDS order items"
  ON kds_order_items FOR UPDATE
  USING (
    kds_order_id IN (
      SELECT id FROM kds_orders 
      WHERE tenant_id IN (SELECT tenant_id FROM users WHERE id = auth.uid())
    )
  );

CREATE POLICY "Users can delete KDS order items"
  ON kds_order_items FOR DELETE
  USING (
    kds_order_id IN (
      SELECT id FROM kds_orders 
      WHERE tenant_id IN (SELECT tenant_id FROM users WHERE id = auth.uid())
    )
  );
