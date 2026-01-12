CREATE TABLE IF NOT EXISTS order_number_counters (
  tenant_id UUID PRIMARY KEY REFERENCES tenants(id) ON DELETE CASCADE,
  last_number BIGINT NOT NULL DEFAULT 0,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE order_number_counters ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION get_next_order_number(p_tenant_id UUID)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_tenant UUID;
  v_next BIGINT;
BEGIN
  SELECT tenant_id
  INTO v_user_tenant
  FROM users
  WHERE id = auth.uid();

  IF v_user_tenant IS NULL OR v_user_tenant <> p_tenant_id THEN
    RAISE EXCEPTION 'Not allowed';
  END IF;

  INSERT INTO order_number_counters (tenant_id)
  VALUES (p_tenant_id)
  ON CONFLICT (tenant_id) DO NOTHING;

  UPDATE order_number_counters
  SET last_number = last_number + 1,
      updated_at = NOW()
  WHERE tenant_id = p_tenant_id
  RETURNING last_number INTO v_next;

  RETURN '#ORD-' || LPAD(v_next::TEXT, 9, '0');
END;
$$;

GRANT EXECUTE ON FUNCTION get_next_order_number(UUID) TO authenticated;
