-- Fix RLS policies for sale_items table
-- Previously only had SELECT policy, causing errors when creating orders

-- Drop policies if they exist to allow re-running
DROP POLICY IF EXISTS "Users can create sale items" ON sale_items;
DROP POLICY IF EXISTS "Users can update sale items" ON sale_items;
DROP POLICY IF EXISTS "Users can delete sale items" ON sale_items;

CREATE POLICY "Users can create sale items"
  ON sale_items FOR INSERT
  WITH CHECK (
    sale_id IN (
      SELECT id FROM sales 
      WHERE tenant_id IN (
        SELECT tenant_id FROM users WHERE id = auth.uid()
      )
    )
  );

CREATE POLICY "Users can update sale items"
  ON sale_items FOR UPDATE
  USING (
    sale_id IN (
      SELECT id FROM sales 
      WHERE tenant_id IN (
        SELECT tenant_id FROM users WHERE id = auth.uid()
      )
    )
  );

CREATE POLICY "Users can delete sale items"
  ON sale_items FOR DELETE
  USING (
    sale_id IN (
      SELECT id FROM sales 
      WHERE tenant_id IN (
        SELECT tenant_id FROM users WHERE id = auth.uid()
      )
    )
  );
