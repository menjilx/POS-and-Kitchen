-- Fix stock deduction logic by moving trigger to sale_items table
-- Previous logic on 'sales' table failed because items didn't exist yet at trigger time

-- 1. Drop the old ineffective trigger and function
DROP TRIGGER IF EXISTS trigger_update_stock_on_sale ON sales;
-- We keep the function `update_stock_on_sale` if we want, but we'll create a better one for items

-- 2. Create function to handle stock updates from SALE ITEMS
CREATE OR REPLACE FUNCTION update_stock_from_sale_item()
RETURNS TRIGGER AS $$
DECLARE
    v_tenant_id UUID;
    v_location_id UUID;
    v_adjustment_type TEXT;
    v_quantity_change NUMERIC;
    v_ingredient_id UUID;
    v_recipe_quantity NUMERIC;
    v_multiplier NUMERIC;
BEGIN
    -- Get tenant_id from the sale (parent table)
    IF (TG_OP = 'INSERT' OR TG_OP = 'UPDATE') THEN
        SELECT tenant_id INTO v_tenant_id FROM sales WHERE id = NEW.sale_id;
    ELSE
        SELECT tenant_id INTO v_tenant_id FROM sales WHERE id = OLD.sale_id;
    END IF;

    -- Get a default location (simplification: pick first location for tenant)
    -- In a multi-location setup, sale should ideally have location_id, or user settings
    SELECT id INTO v_location_id FROM locations WHERE tenant_id = v_tenant_id LIMIT 1;

    IF v_location_id IS NULL THEN
        -- If no location, we can't track stock. Exit gracefully.
        RETURN NULL;
    END IF;

    -- Iterate through recipe items for the menu item
    FOR v_ingredient_id, v_recipe_quantity IN
        SELECT ingredient_id, quantity 
        FROM recipe_items 
        WHERE menu_item_id = COALESCE(NEW.menu_item_id, OLD.menu_item_id)
    LOOP
        -- Calculate how many units of ingredient to deduct/add
        IF (TG_OP = 'INSERT') THEN
            -- New sale item: Deduct stock
            v_multiplier := -1;
            v_quantity_change := (NEW.quantity * v_recipe_quantity) * v_multiplier;
            v_adjustment_type := 'sale';
            
        ELSIF (TG_OP = 'DELETE') THEN
            -- Removed sale item (void/delete): Restore stock
            v_multiplier := 1;
            v_quantity_change := (OLD.quantity * v_recipe_quantity) * v_multiplier;
            v_adjustment_type := 'adjustment'; -- or 'void'

        ELSIF (TG_OP = 'UPDATE') THEN
            -- Quantity changed
            v_multiplier := -1;
            -- Diff: (NewQty - OldQty) * RecipeQty * -1 (to deduct increase)
            -- Example: 1 -> 2. Diff = 1. Deduct 1 * Recipe.
            -- Example: 2 -> 1. Diff = -1. Deduct -1 * Recipe = Add 1 * Recipe.
            v_quantity_change := ((NEW.quantity - OLD.quantity) * v_recipe_quantity) * v_multiplier;
            v_adjustment_type := 'adjustment';
        END IF;

        IF v_quantity_change != 0 THEN
            -- 1. Insert Stock Adjustment Record
            INSERT INTO stock_adjustments (
                tenant_id,
                ingredient_id,
                location_id,
                adjustment_type,
                quantity,
                reference_id,
                notes,
                created_by
            ) VALUES (
                v_tenant_id,
                v_ingredient_id,
                v_location_id,
                v_adjustment_type::stock_adjustment_type,
                v_quantity_change,
                COALESCE(NEW.id, OLD.id),
                'System Auto-Deduction',
                NULL -- System action
            );

            -- 2. Update Stock Table
            INSERT INTO stock (tenant_id, ingredient_id, location_id, quantity, last_updated)
            VALUES (v_tenant_id, v_ingredient_id, v_location_id, v_quantity_change, NOW())
            ON CONFLICT (ingredient_id, location_id)
            DO UPDATE SET 
                quantity = stock.quantity + EXCLUDED.quantity,
                last_updated = NOW();
        END IF;
    END LOOP;

    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- 3. Create Triggers on sale_items
DROP TRIGGER IF EXISTS trigger_stock_update_on_insert ON sale_items;
CREATE TRIGGER trigger_stock_update_on_insert
    AFTER INSERT ON sale_items
    FOR EACH ROW
    EXECUTE FUNCTION update_stock_from_sale_item();

DROP TRIGGER IF EXISTS trigger_stock_update_on_update ON sale_items;
CREATE TRIGGER trigger_stock_update_on_update
    AFTER UPDATE ON sale_items
    FOR EACH ROW
    EXECUTE FUNCTION update_stock_from_sale_item();

DROP TRIGGER IF EXISTS trigger_stock_update_on_delete ON sale_items;
CREATE TRIGGER trigger_stock_update_on_delete
    AFTER DELETE ON sale_items
    FOR EACH ROW
    EXECUTE FUNCTION update_stock_from_sale_item();
