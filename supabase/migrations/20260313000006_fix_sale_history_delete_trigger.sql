-- Fix: On DELETE, the AFTER DELETE trigger inserts a sale_history row with
-- sale_id = OLD.id, but that row no longer exists → FK violation.
-- Solution: insert sale_id = NULL for DELETE operations. The full sale data
-- is already captured in details->'old' via row_to_json(OLD).

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
    IF NEW.payment_status = 'voided' AND OLD.payment_status <> 'voided' THEN
      v_action := 'voided';
    ELSIF NEW.payment_status = 'refunded' AND OLD.payment_status <> 'refunded' THEN
      v_action := 'refunded';
    ELSE
      v_action := 'updated';
    END IF;
    v_details := jsonb_build_object('old', row_to_json(OLD), 'new', row_to_json(NEW));
  END IF;

  INSERT INTO sale_history (sale_id, action, details, created_by)
  VALUES (
    CASE WHEN TG_OP = 'DELETE' THEN NULL ELSE COALESCE(NEW.id, OLD.id) END,
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
