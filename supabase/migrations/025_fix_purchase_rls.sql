-- Add missing INSERT policy for purchase_items
CREATE POLICY "Users can create purchase items"
  ON purchase_items FOR INSERT
  WITH CHECK (
    purchase_id IN (
      SELECT id FROM purchases 
      WHERE tenant_id IN (SELECT tenant_id FROM users WHERE id = auth.uid())
    )
  );

-- Update the trigger function to be SECURITY DEFINER to bypass RLS on stock table
-- This is necessary because 'staff' users might not have direct UPDATE permission on stock table
CREATE OR REPLACE FUNCTION update_stock_from_purchase_item()
RETURNS TRIGGER AS $$
DECLARE
  v_tenant_id UUID;
BEGIN
  -- Get tenant_id from purchase
  SELECT tenant_id INTO v_tenant_id
  FROM purchases
  WHERE id = NEW.purchase_id;

  INSERT INTO stock (
    tenant_id, ingredient_id, location_id, quantity
  )
  VALUES (
    v_tenant_id,
    NEW.ingredient_id,
    NEW.location_id,
    NEW.quantity
  )
  ON CONFLICT (ingredient_id, location_id)
  DO UPDATE SET 
    quantity = stock.quantity + EXCLUDED.quantity,
    last_updated = NOW();
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
