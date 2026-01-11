
-- Enable RLS on recipe_items (just to be safe, though it should be already)
ALTER TABLE recipe_items ENABLE ROW LEVEL SECURITY;

-- Policy for INSERT
-- Users can insert recipe items if they belong to the same tenant as the menu item
CREATE POLICY "Users can create recipe items"
  ON recipe_items FOR INSERT
  WITH CHECK (
    menu_item_id IN (
      SELECT id FROM menu_items 
      WHERE tenant_id IN (SELECT tenant_id FROM users WHERE id = auth.uid())
    )
  );

-- Policy for UPDATE
-- Users can update recipe items if they belong to the same tenant as the menu item
CREATE POLICY "Users can update recipe items"
  ON recipe_items FOR UPDATE
  USING (
    menu_item_id IN (
      SELECT id FROM menu_items 
      WHERE tenant_id IN (SELECT tenant_id FROM users WHERE id = auth.uid())
    )
  );

-- Policy for DELETE
-- Users can delete recipe items if they belong to the same tenant as the menu item
CREATE POLICY "Users can delete recipe items"
  ON recipe_items FOR DELETE
  USING (
    menu_item_id IN (
      SELECT id FROM menu_items 
      WHERE tenant_id IN (SELECT tenant_id FROM users WHERE id = auth.uid())
    )
  );
