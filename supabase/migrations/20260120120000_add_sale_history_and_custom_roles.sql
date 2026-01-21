ALTER TABLE users DROP CONSTRAINT IF EXISTS users_role_check;
ALTER TABLE role_permissions DROP CONSTRAINT IF EXISTS role_permissions_role_check;

CREATE TABLE IF NOT EXISTS sale_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  sale_id uuid NOT NULL REFERENCES sales(id) ON DELETE CASCADE,
  action text NOT NULL,
  details jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_by uuid REFERENCES users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE sale_history ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view sale history in their tenant" ON sale_history;
DROP POLICY IF EXISTS "Users can insert sale history in their tenant" ON sale_history;

CREATE POLICY "Users can view sale history in their tenant"
  ON sale_history FOR SELECT
  USING (tenant_id = get_auth_tenant_id());

CREATE POLICY "Users can insert sale history in their tenant"
  ON sale_history FOR INSERT
  WITH CHECK (tenant_id = get_auth_tenant_id() AND created_by = auth.uid());

CREATE INDEX IF NOT EXISTS idx_sale_history_tenant_id ON sale_history(tenant_id);
CREATE INDEX IF NOT EXISTS idx_sale_history_sale_id ON sale_history(sale_id);

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

  INSERT INTO sale_history (tenant_id, sale_id, action, details, created_by)
  VALUES (
    COALESCE(NEW.tenant_id, OLD.tenant_id),
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

DROP TRIGGER IF EXISTS trigger_log_sale_history_insert ON sales;
DROP TRIGGER IF EXISTS trigger_log_sale_history_update ON sales;
DROP TRIGGER IF EXISTS trigger_log_sale_history_delete ON sales;

CREATE TRIGGER trigger_log_sale_history_insert
  AFTER INSERT ON sales
  FOR EACH ROW
  EXECUTE FUNCTION log_sale_history();

CREATE TRIGGER trigger_log_sale_history_update
  AFTER UPDATE ON sales
  FOR EACH ROW
  EXECUTE FUNCTION log_sale_history();

CREATE TRIGGER trigger_log_sale_history_delete
  AFTER DELETE ON sales
  FOR EACH ROW
  EXECUTE FUNCTION log_sale_history();

CREATE OR REPLACE FUNCTION update_last_login()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE users
  SET last_login = now()
  WHERE id = auth.uid();
END;
$$;

GRANT EXECUTE ON FUNCTION update_last_login() TO authenticated;
