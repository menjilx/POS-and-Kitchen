-- Fix reporting functions by using SECURITY DEFINER to bypass complex RLS chains
-- and ensure explicit permission checks.

-- 1. get_menu_performance
CREATE OR REPLACE FUNCTION get_menu_performance(p_tenant_id UUID, p_start_date DATE DEFAULT NULL, p_end_date DATE DEFAULT NULL)
RETURNS TABLE (
  menu_item_id UUID,
  menu_item_name VARCHAR,
  quantity_sold INTEGER,
  total_revenue DECIMAL,
  total_cost DECIMAL,
  total_margin DECIMAL,
  margin_percentage DECIMAL
) 
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_start_date DATE := COALESCE(p_start_date, CURRENT_DATE - INTERVAL '7 days');
  v_end_date DATE := COALESCE(p_end_date, CURRENT_DATE);
  v_user_tenant UUID;
BEGIN
  -- Verify user access
  SELECT tenant_id INTO v_user_tenant
  FROM users
  WHERE id = auth.uid();

  IF v_user_tenant IS NULL OR v_user_tenant != p_tenant_id THEN
    -- Allow superadmins to bypass (optional, but good for testing if needed)
    -- Checking if user is superadmin (simplified check based on common patterns, or just strict tenant check)
    -- For now, strict tenant check is safer.
    -- If user is superadmin, they usually don't have a tenant_id in users table (it's null), so this blocks them.
    -- But superadmins usually use the admin dashboard.
    -- If we want to allow superadmins, we'd need to check the role.
    -- Assuming this is for tenant users:
    RAISE EXCEPTION 'Access denied';
  END IF;

  RETURN QUERY
  SELECT 
    mi.id AS menu_item_id,
    mi.name AS menu_item_name,
    COALESCE(SUM(si.quantity), 0)::INTEGER AS quantity_sold,
    COALESCE(SUM(si.total_price), 0) AS total_revenue,
    COALESCE(SUM(si.quantity * mi.total_cost), 0) AS total_cost,
    COALESCE(SUM(si.total_price - (si.quantity * mi.total_cost)), 0) AS total_margin,
    CASE 
      WHEN COALESCE(SUM(si.total_price), 0) > 0 
      THEN (COALESCE(SUM(si.total_price - (si.quantity * mi.total_cost)), 0) / COALESCE(SUM(si.total_price), 0)) * 100
      ELSE 0
    END AS margin_percentage
  FROM menu_items mi
  LEFT JOIN (
    SELECT si.menu_item_id, si.quantity, si.total_price
    FROM sale_items si
    JOIN sales s ON si.sale_id = s.id
    WHERE s.tenant_id = p_tenant_id
    AND s.sale_date BETWEEN v_start_date AND v_end_date
    AND s.payment_status != 'refunded'
  ) si ON mi.id = si.menu_item_id
  WHERE mi.tenant_id = p_tenant_id
  GROUP BY mi.id, mi.name, mi.total_cost
  ORDER BY quantity_sold DESC;
END;
$$ LANGUAGE plpgsql;

-- 2. get_ingredient_cost_trends
CREATE OR REPLACE FUNCTION get_ingredient_cost_trends(p_tenant_id UUID, p_start_date DATE DEFAULT NULL, p_end_date DATE DEFAULT NULL)
RETURNS TABLE (
  ingredient_id UUID,
  ingredient_name VARCHAR,
  unit VARCHAR,
  avg_cost_per_unit DECIMAL,
  total_purchased DECIMAL,
  last_cost_per_unit DECIMAL,
  cost_change_percentage DECIMAL
)
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_start_date DATE := COALESCE(p_start_date, CURRENT_DATE - INTERVAL '30 days');
  v_end_date DATE := COALESCE(p_end_date, CURRENT_DATE);
  v_user_tenant UUID;
BEGIN
  -- Verify user access
  SELECT tenant_id INTO v_user_tenant
  FROM users
  WHERE id = auth.uid();

  IF v_user_tenant IS NULL OR v_user_tenant != p_tenant_id THEN
    RAISE EXCEPTION 'Access denied';
  END IF;

  RETURN QUERY
  WITH purchase_data AS (
    SELECT 
      pi.ingredient_id,
      pi.unit_price,
      pi.quantity
    FROM purchase_items pi
    JOIN purchases p ON pi.purchase_id = p.id
    WHERE p.tenant_id = p_tenant_id
    AND p.invoice_date BETWEEN v_start_date AND v_end_date
  ),
  ingredient_stats AS (
    SELECT 
        pd.ingredient_id,
        SUM(pd.quantity) as total_qty,
        SUM(pd.quantity * pd.unit_price) as total_cost
    FROM purchase_data pd
    GROUP BY pd.ingredient_id
  )
  SELECT 
    i.id AS ingredient_id,
    i.name AS ingredient_name,
    i.unit AS unit,
    CAST(COALESCE(
        CASE WHEN ist.total_qty > 0 THEN ist.total_cost / ist.total_qty ELSE i.cost_per_unit END, 
        i.cost_per_unit
    ) AS DECIMAL) AS avg_cost_per_unit,
    CAST(COALESCE(ist.total_qty, 0) AS DECIMAL) AS total_purchased,
    i.cost_per_unit AS last_cost_per_unit,
    CAST(CASE 
      WHEN COALESCE(
          CASE WHEN ist.total_qty > 0 THEN ist.total_cost / ist.total_qty ELSE i.cost_per_unit END, 
          i.cost_per_unit
      ) > 0 
      THEN (
          (i.cost_per_unit - COALESCE(
              CASE WHEN ist.total_qty > 0 THEN ist.total_cost / ist.total_qty ELSE i.cost_per_unit END, 
              i.cost_per_unit
          )) 
          / 
          COALESCE(
              CASE WHEN ist.total_qty > 0 THEN ist.total_cost / ist.total_qty ELSE i.cost_per_unit END, 
              i.cost_per_unit
          )
      ) * 100
      ELSE 0
    END AS DECIMAL) AS cost_change_percentage
  FROM ingredients i
  LEFT JOIN ingredient_stats ist ON i.id = ist.ingredient_id
  WHERE i.tenant_id = p_tenant_id
  ORDER BY cost_change_percentage DESC;
END;
$$ LANGUAGE plpgsql;
