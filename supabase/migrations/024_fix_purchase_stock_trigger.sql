-- Drop the broken trigger and function
DROP TRIGGER IF EXISTS trigger_update_stock_on_purchase ON purchases;
DROP FUNCTION IF EXISTS update_stock_on_purchase();

-- Create new function to update stock from purchase item
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
$$ LANGUAGE plpgsql;

-- Create trigger on purchase_items
CREATE TRIGGER trigger_update_stock_from_purchase_item
  AFTER INSERT ON purchase_items
  FOR EACH ROW
  EXECUTE FUNCTION update_stock_from_purchase_item();
