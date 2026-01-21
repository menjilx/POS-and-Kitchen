CREATE OR REPLACE FUNCTION log_sale_history()
RETURNS TRIGGER AS $$
DECLARE
  v_action text;
  v_details jsonb;
  v_sale_id uuid;
BEGIN
  IF (TG_OP = 'INSERT') THEN
    v_action := 'created';
    v_details := jsonb_build_object('new', row_to_json(NEW));
    v_sale_id := NEW.id;
  ELSIF (TG_OP = 'DELETE') THEN
    v_action := 'deleted';
    v_details := jsonb_build_object('old', row_to_json(OLD));
    v_sale_id := NULL;
  ELSE
    IF NEW.payment_status = 'refunded' AND OLD.payment_status <> 'refunded' THEN
      v_action := 'refunded';
    ELSE
      v_action := 'updated';
    END IF;
    v_details := jsonb_build_object('old', row_to_json(OLD), 'new', row_to_json(NEW));
    v_sale_id := NEW.id;
  END IF;

  INSERT INTO sale_history (tenant_id, sale_id, action, details, created_by)
  VALUES (
    COALESCE(NEW.tenant_id, OLD.tenant_id),
    v_sale_id,
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
