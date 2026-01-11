-- Add usage_unit and conversion_factor to ingredients table
ALTER TABLE ingredients
ADD COLUMN IF NOT EXISTS usage_unit VARCHAR(50),
ADD COLUMN IF NOT EXISTS conversion_factor DECIMAL(10, 4) DEFAULT 1;

-- Update existing ingredients to have usage_unit same as unit if null
UPDATE ingredients SET usage_unit = unit WHERE usage_unit IS NULL;

-- Update the cost calculation function to use conversion_factor
CREATE OR REPLACE FUNCTION update_menu_item_cost()
RETURNS TRIGGER AS $$
DECLARE
  v_total_cost DECIMAL(10, 2);
BEGIN
  IF NEW.id IS NULL THEN
    NEW.total_cost := 0;
    NEW.contribution_margin := NEW.selling_price - NEW.labor_cost;
  ELSE
    -- Calculate food cost from recipe
    -- Formula: (quantity / conversion_factor) * cost_per_unit
    -- Example: 50ml / 1000 (ml/box) * 100 (cost/box) = 5
    SELECT COALESCE(SUM(
      ((ri.quantity / COALESCE(NULLIF(i.conversion_factor, 0), 1)) * i.cost_per_unit) * (1 + NEW.waste_percentage / 100)
    ), 0)
    INTO v_total_cost
    FROM recipe_items ri
    JOIN ingredients i ON ri.ingredient_id = i.id
    WHERE ri.menu_item_id = NEW.id;
    
    -- Total cost = food cost + labor
    NEW.total_cost := COALESCE(v_total_cost, 0) + NEW.labor_cost;
    NEW.contribution_margin := NEW.selling_price - NEW.total_cost;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create function to update menu item when recipe changes
CREATE OR REPLACE FUNCTION update_menu_cost_on_recipe_change()
RETURNS TRIGGER AS $$
BEGIN
  -- Trigger update on menu_item to force cost recalculation
  -- We update labor_cost to itself to fire the specific trigger
  IF (TG_OP = 'DELETE') THEN
    UPDATE menu_items 
    SET labor_cost = labor_cost 
    WHERE id = OLD.menu_item_id;
  ELSE
    UPDATE menu_items 
    SET labor_cost = labor_cost 
    WHERE id = NEW.menu_item_id;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Create trigger on recipe_items
DROP TRIGGER IF EXISTS trigger_update_menu_cost_from_recipe ON recipe_items;
CREATE TRIGGER trigger_update_menu_cost_from_recipe
AFTER INSERT OR UPDATE OR DELETE ON recipe_items
FOR EACH ROW
EXECUTE FUNCTION update_menu_cost_on_recipe_change();
