-- Link simple menu items to a stock item (ingredient) for purchases/stock

ALTER TABLE menu_items
ADD COLUMN IF NOT EXISTS stock_ingredient_id UUID REFERENCES ingredients(id) ON DELETE SET NULL;

UPDATE menu_items mi
SET stock_ingredient_id = ri.ingredient_id
FROM (
  SELECT DISTINCT ON (menu_item_id) menu_item_id, ingredient_id
  FROM recipe_items
  ORDER BY menu_item_id, created_at ASC
) ri
WHERE mi.id = ri.menu_item_id
  AND mi.item_type = 'simple'
  AND mi.stock_ingredient_id IS NULL;

CREATE OR REPLACE FUNCTION update_menu_item_cost()
RETURNS TRIGGER AS $$
DECLARE
  v_total_cost DECIMAL(10, 2);
  v_stock_cost DECIMAL(10, 2);
BEGIN
  IF NEW.item_type = 'simple' AND NEW.stock_ingredient_id IS NOT NULL THEN
    SELECT cost_per_unit INTO v_stock_cost
    FROM ingredients
    WHERE id = NEW.stock_ingredient_id;

    NEW.total_cost := (COALESCE(v_stock_cost, 0) * (1 + NEW.waste_percentage / 100)) + NEW.labor_cost;
    NEW.contribution_margin := NEW.selling_price - NEW.total_cost;
    RETURN NEW;
  END IF;

  IF NEW.id IS NULL THEN
    NEW.total_cost := 0;
    NEW.contribution_margin := NEW.selling_price - NEW.labor_cost;
  ELSE
    SELECT COALESCE(SUM(
      ((ri.quantity / COALESCE(NULLIF(i.conversion_factor, 0), 1)) * i.cost_per_unit) * (1 + NEW.waste_percentage / 100)
    ), 0)
    INTO v_total_cost
    FROM recipe_items ri
    JOIN ingredients i ON ri.ingredient_id = i.id
    WHERE ri.menu_item_id = NEW.id;

    NEW.total_cost := COALESCE(v_total_cost, 0) + NEW.labor_cost;
    NEW.contribution_margin := NEW.selling_price - NEW.total_cost;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

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
    v_menu_item_id UUID;
    v_item_type TEXT;
    v_stock_ingredient_id UUID;
BEGIN
    IF (TG_OP = 'INSERT' OR TG_OP = 'UPDATE') THEN
        SELECT tenant_id INTO v_tenant_id FROM sales WHERE id = NEW.sale_id;
        v_menu_item_id := NEW.menu_item_id;
    ELSE
        SELECT tenant_id INTO v_tenant_id FROM sales WHERE id = OLD.sale_id;
        v_menu_item_id := OLD.menu_item_id;
    END IF;

    SELECT id INTO v_location_id FROM locations WHERE tenant_id = v_tenant_id LIMIT 1;
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
                NULL
            );

            INSERT INTO stock (tenant_id, ingredient_id, location_id, quantity, last_updated)
            VALUES (v_tenant_id, v_ingredient_id, v_location_id, v_quantity_change, NOW())
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
                NULL
            );

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

CREATE OR REPLACE FUNCTION get_stock_item_cost_trends(p_tenant_id UUID, p_start_date DATE DEFAULT NULL, p_end_date DATE DEFAULT NULL)
RETURNS TABLE (
  stock_item_id UUID,
  stock_item_name VARCHAR,
  unit VARCHAR,
  avg_cost_per_unit DECIMAL,
  total_purchased DECIMAL,
  last_cost_per_unit DECIMAL,
  cost_change_percentage DECIMAL
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    ingredient_id AS stock_item_id,
    ingredient_name AS stock_item_name,
    unit,
    avg_cost_per_unit,
    total_purchased,
    last_cost_per_unit,
    cost_change_percentage
  FROM get_ingredient_cost_trends(p_tenant_id, p_start_date, p_end_date);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
