-- Update function to handle INSERT, UPDATE, DELETE
CREATE OR REPLACE FUNCTION update_stock_from_purchase_item()
RETURNS TRIGGER AS $$
DECLARE
  v_tenant_id UUID;
  v_diff NUMERIC;
BEGIN
  IF (TG_OP = 'DELETE') THEN
    -- Get tenant_id from OLD purchase
    SELECT tenant_id INTO v_tenant_id
    FROM purchases
    WHERE id = OLD.purchase_id;

    -- Decrease stock
    UPDATE stock
    SET quantity = quantity - OLD.quantity,
        last_updated = NOW()
    WHERE ingredient_id = OLD.ingredient_id
      AND location_id = OLD.location_id;
      
    RETURN OLD;

  ELSIF (TG_OP = 'UPDATE') THEN
    SELECT tenant_id INTO v_tenant_id
    FROM purchases
    WHERE id = NEW.purchase_id;
    
    -- If location or ingredient changed, we need to revert old and add new
    IF (NEW.location_id <> OLD.location_id OR NEW.ingredient_id <> OLD.ingredient_id) THEN
      -- Revert OLD stock
      UPDATE stock
      SET quantity = quantity - OLD.quantity,
          last_updated = NOW()
      WHERE ingredient_id = OLD.ingredient_id
        AND location_id = OLD.location_id;
        
      -- Add NEW stock
      INSERT INTO stock (tenant_id, ingredient_id, location_id, quantity)
      VALUES (v_tenant_id, NEW.ingredient_id, NEW.location_id, NEW.quantity)
      ON CONFLICT (ingredient_id, location_id)
      DO UPDATE SET quantity = stock.quantity + EXCLUDED.quantity, last_updated = NOW();
    ELSE
      -- Just quantity update
      v_diff := NEW.quantity - OLD.quantity;
      
      UPDATE stock
      SET quantity = quantity + v_diff,
          last_updated = NOW()
      WHERE ingredient_id = NEW.ingredient_id
        AND location_id = NEW.location_id;
    END IF;
    
    RETURN NEW;

  ELSIF (TG_OP = 'INSERT') THEN
    SELECT tenant_id INTO v_tenant_id
    FROM purchases
    WHERE id = NEW.purchase_id;

    INSERT INTO stock (tenant_id, ingredient_id, location_id, quantity)
    VALUES (v_tenant_id, NEW.ingredient_id, NEW.location_id, NEW.quantity)
    ON CONFLICT (ingredient_id, location_id)
    DO UPDATE SET quantity = stock.quantity + EXCLUDED.quantity, last_updated = NOW();
    
    RETURN NEW;
  END IF;
  
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Drop existing trigger (which was INSERT only)
DROP TRIGGER IF EXISTS trigger_update_stock_from_purchase_item ON purchase_items;

-- Create new trigger for all operations
CREATE TRIGGER trigger_update_stock_from_purchase_item
  AFTER INSERT OR UPDATE OR DELETE ON purchase_items
  FOR EACH ROW
  EXECUTE FUNCTION update_stock_from_purchase_item();
