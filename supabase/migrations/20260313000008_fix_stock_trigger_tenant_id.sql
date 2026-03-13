-- Fix update_stock_from_sale_item trigger function.
-- It still references tenant_id which was removed by the single-tenant refactor.
-- Rewrite to work without tenant_id: pick the first location directly.

BEGIN;

CREATE OR REPLACE FUNCTION update_stock_from_sale_item()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_location_id UUID;
    v_adjustment_type TEXT;
    v_quantity_change NUMERIC;
    v_ingredient_id UUID;
    v_recipe_quantity NUMERIC;
    v_multiplier NUMERIC;
    v_menu_item_id UUID;
    v_item_type TEXT;
    v_stock_ingredient_id UUID;
BEGIN
    IF (TG_OP = 'INSERT' OR TG_OP = 'UPDATE') THEN
        v_menu_item_id := NEW.menu_item_id;
    ELSE
        v_menu_item_id := OLD.menu_item_id;
    END IF;

    -- Single-tenant: pick the first location
    SELECT id INTO v_location_id FROM locations LIMIT 1;
    IF v_location_id IS NULL THEN
        RETURN NULL;
    END IF;

    SELECT item_type, stock_ingredient_id
    INTO v_item_type, v_stock_ingredient_id
    FROM menu_items
    WHERE id = v_menu_item_id;

    IF v_item_type = 'simple' AND v_stock_ingredient_id IS NOT NULL THEN
        v_ingredient_id := v_stock_ingredient_id;
        v_recipe_quantity := 1;

        IF (TG_OP = 'INSERT') THEN
            v_multiplier := -1;
            v_quantity_change := (NEW.quantity * v_recipe_quantity) * v_multiplier;
            v_adjustment_type := 'sale';
        ELSIF (TG_OP = 'DELETE') THEN
            v_multiplier := 1;
            v_quantity_change := (OLD.quantity * v_recipe_quantity) * v_multiplier;
            v_adjustment_type := 'adjustment';
        ELSIF (TG_OP = 'UPDATE') THEN
            v_multiplier := -1;
            v_quantity_change := ((NEW.quantity - OLD.quantity) * v_recipe_quantity) * v_multiplier;
            v_adjustment_type := 'adjustment';
        END IF;

        IF v_quantity_change != 0 THEN
            INSERT INTO stock_adjustments (
                ingredient_id,
                location_id,
                adjustment_type,
                quantity,
                reference_id,
                notes,
                created_by
            ) VALUES (
                v_ingredient_id,
                v_location_id,
                v_adjustment_type::stock_adjustment_type,
                v_quantity_change,
                COALESCE(NEW.id, OLD.id),
                'System Auto-Deduction',
                NULL
            );

            INSERT INTO stock (ingredient_id, location_id, quantity, last_updated)
            VALUES (v_ingredient_id, v_location_id, v_quantity_change, NOW())
            ON CONFLICT (ingredient_id, location_id)
            DO UPDATE SET
                quantity = stock.quantity + EXCLUDED.quantity,
                last_updated = NOW();
        END IF;

        RETURN NULL;
    END IF;

    FOR v_ingredient_id, v_recipe_quantity IN
        SELECT ingredient_id, quantity
        FROM recipe_items
        WHERE menu_item_id = v_menu_item_id
    LOOP
        IF (TG_OP = 'INSERT') THEN
            v_multiplier := -1;
            v_quantity_change := (NEW.quantity * v_recipe_quantity) * v_multiplier;
            v_adjustment_type := 'sale';
        ELSIF (TG_OP = 'DELETE') THEN
            v_multiplier := 1;
            v_quantity_change := (OLD.quantity * v_recipe_quantity) * v_multiplier;
            v_adjustment_type := 'adjustment';
        ELSIF (TG_OP = 'UPDATE') THEN
            v_multiplier := -1;
            v_quantity_change := ((NEW.quantity - OLD.quantity) * v_recipe_quantity) * v_multiplier;
            v_adjustment_type := 'adjustment';
        END IF;

        IF v_quantity_change != 0 THEN
            INSERT INTO stock_adjustments (
                ingredient_id,
                location_id,
                adjustment_type,
                quantity,
                reference_id,
                notes,
                created_by
            ) VALUES (
                v_ingredient_id,
                v_location_id,
                v_adjustment_type::stock_adjustment_type,
                v_quantity_change,
                COALESCE(NEW.id, OLD.id),
                'System Auto-Deduction',
                NULL
            );

            INSERT INTO stock (ingredient_id, location_id, quantity, last_updated)
            VALUES (v_ingredient_id, v_location_id, v_quantity_change, NOW())
            ON CONFLICT (ingredient_id, location_id)
            DO UPDATE SET
                quantity = stock.quantity + EXCLUDED.quantity,
                last_updated = NOW();
        END IF;
    END LOOP;

    RETURN NULL;
END;
$$;

COMMIT;
