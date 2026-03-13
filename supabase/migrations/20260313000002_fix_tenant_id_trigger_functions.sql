-- Fix trigger functions that still reference tenant_id after single-tenant refactor
-- These functions fire on sales INSERT/UPDATE and cause error 42703

BEGIN;

-- update_stock_on_sale: remove tenant_id references
CREATE OR REPLACE FUNCTION update_stock_on_sale()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO stock_adjustments (
    ingredient_id, location_id, adjustment_type, quantity, reference_id, created_by
  )
  SELECT
    ri.ingredient_id,
    (SELECT id FROM locations LIMIT 1),
    'sale',
    (ri.quantity * si.quantity) * -1,
    si.id,
    NEW.created_by
  FROM sale_items si
  JOIN menu_items mi ON si.menu_item_id = mi.id
  JOIN recipe_items ri ON mi.id = ri.menu_item_id
  WHERE si.sale_id = NEW.id;

  UPDATE stock s
  SET quantity = s.quantity + (
    SELECT (ri.quantity * si.quantity) * -1
    FROM sale_items si
    JOIN recipe_items ri ON si.menu_item_id = ri.menu_item_id
    WHERE si.sale_id = NEW.id AND ri.ingredient_id = s.ingredient_id
  ),
  last_updated = NOW()
  WHERE s.ingredient_id IN (
    SELECT ri.ingredient_id
    FROM sale_items si
    JOIN recipe_items ri ON si.menu_item_id = ri.menu_item_id
    WHERE si.sale_id = NEW.id
  );

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- create_kds_order_from_sale: remove tenant_id
CREATE OR REPLACE FUNCTION create_kds_order_from_sale()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO kds_orders (
    sale_id, order_number, priority
  )
  VALUES (
    NEW.id,
    NEW.order_number,
    'normal'
  );

  INSERT INTO kds_order_items (kds_order_id, menu_item_id, quantity, notes)
  SELECT
    (SELECT id FROM kds_orders WHERE sale_id = NEW.id),
    menu_item_id,
    quantity,
    notes
  FROM sale_items
  WHERE sale_id = NEW.id;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- log_sale_history: remove tenant_id reference
CREATE OR REPLACE FUNCTION log_sale_history()
RETURNS TRIGGER AS $$
DECLARE
  v_action text;
  v_details jsonb;
BEGIN
  IF (TG_OP = 'INSERT') THEN
    v_action := 'created';
    v_details := jsonb_build_object('new', row_to_json(NEW));
  ELSIF (TG_OP = 'DELETE') THEN
    v_action := 'deleted';
    v_details := jsonb_build_object('old', row_to_json(OLD));
  ELSE
    IF NEW.payment_status = 'refunded' AND OLD.payment_status <> 'refunded' THEN
      v_action := 'refunded';
    ELSE
      v_action := 'updated';
    END IF;
    v_details := jsonb_build_object('old', row_to_json(OLD), 'new', row_to_json(NEW));
  END IF;

  INSERT INTO sale_history (sale_id, action, details, created_by)
  VALUES (
    COALESCE(NEW.id, OLD.id),
    v_action,
    v_details,
    auth.uid()
  );

  IF (TG_OP = 'DELETE') THEN
    RETURN OLD;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

COMMIT;
