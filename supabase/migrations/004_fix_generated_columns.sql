-- Fix: Replace GENERATED columns with regular columns and triggers
-- This removes the problematic generated columns that require subqueries

-- Remove generated columns from stocktake_items and add them as regular columns
ALTER TABLE stocktake_items 
  DROP COLUMN IF EXISTS variance,
  DROP COLUMN IF EXISTS variance_percentage;

ALTER TABLE stocktake_items 
  ADD COLUMN IF NOT EXISTS variance DECIMAL(10, 2) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS variance_percentage DECIMAL(10, 2) DEFAULT 0;

-- Function to update stocktake variance
CREATE OR REPLACE FUNCTION update_stocktake_variance()
RETURNS TRIGGER AS $$
BEGIN
  NEW.variance := NEW.actual_quantity - NEW.expected_quantity;
  NEW.variance_percentage := CASE 
    WHEN NEW.expected_quantity = 0 THEN 0
    ELSE ((NEW.actual_quantity - NEW.expected_quantity) / NEW.expected_quantity) * 100
  END;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_stocktake_variance ON stocktake_items;
CREATE TRIGGER trigger_update_stocktake_variance
  BEFORE INSERT OR UPDATE ON stocktake_items
  FOR EACH ROW
  EXECUTE FUNCTION update_stocktake_variance();

-- Remove generated columns from menu_items and add them as regular columns
ALTER TABLE menu_items
  DROP COLUMN IF EXISTS total_cost,
  DROP COLUMN IF EXISTS contribution_margin;

ALTER TABLE menu_items
  ADD COLUMN IF NOT EXISTS total_cost DECIMAL(10, 2) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS contribution_margin DECIMAL(10, 2) DEFAULT 0;

-- Function to update menu item costs
CREATE OR REPLACE FUNCTION update_menu_item_cost()
RETURNS TRIGGER AS $$
DECLARE
  v_total_cost DECIMAL(10, 2);
BEGIN
  -- Calculate food cost from recipe
  SELECT COALESCE(SUM(
    (ri.quantity * i.cost_per_unit) * (1 + NEW.waste_percentage / 100)
  ), 0)
  INTO v_total_cost
  FROM recipe_items ri
  JOIN ingredients i ON ri.ingredient_id = i.id
  WHERE ri.menu_item_id = NEW.id;
  
  -- Total cost = food cost + labor
  NEW.total_cost := COALESCE(v_total_cost, 0) + NEW.labor_cost;
  NEW.contribution_margin := NEW.selling_price - NEW.total_cost;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_menu_item_cost ON menu_items;
CREATE TRIGGER trigger_update_menu_item_cost
  BEFORE INSERT OR UPDATE OF selling_price, waste_percentage, labor_cost ON menu_items
  FOR EACH ROW
  EXECUTE FUNCTION update_menu_item_cost();

-- Remove generated column from purchase_items and add as regular column
ALTER TABLE purchase_items
  DROP COLUMN IF EXISTS total_price;

ALTER TABLE purchase_items
  ADD COLUMN IF NOT EXISTS total_price DECIMAL(10, 2) DEFAULT 0;

-- Function to update purchase item total
CREATE OR REPLACE FUNCTION update_purchase_item_total()
RETURNS TRIGGER AS $$
BEGIN
  NEW.total_price := NEW.quantity * NEW.unit_price;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_purchase_item_total ON purchase_items;
CREATE TRIGGER trigger_update_purchase_item_total
  BEFORE INSERT OR UPDATE ON purchase_items
  FOR EACH ROW
  EXECUTE FUNCTION update_purchase_item_total();

-- Remove generated column from sale_items and add as regular column
ALTER TABLE sale_items
  DROP COLUMN IF EXISTS total_price;

ALTER TABLE sale_items
  ADD COLUMN IF NOT EXISTS total_price DECIMAL(10, 2) DEFAULT 0;

-- Function to update sale item total
CREATE OR REPLACE FUNCTION update_sale_item_total()
RETURNS TRIGGER AS $$
BEGIN
  NEW.total_price := NEW.quantity * NEW.unit_price;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_sale_item_total ON sale_items;
CREATE TRIGGER trigger_update_sale_item_total
  BEFORE INSERT OR UPDATE ON sale_items
  FOR EACH ROW
  EXECUTE FUNCTION update_sale_item_total();
