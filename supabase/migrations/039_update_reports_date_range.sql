-- Update get_menu_performance to use date range
CREATE OR REPLACE FUNCTION get_menu_performance(p_tenant_id UUID, p_start_date DATE DEFAULT NULL, p_end_date DATE DEFAULT NULL)
RETURNS TABLE (
  menu_item_id UUID,
  menu_item_name VARCHAR,
  quantity_sold INTEGER,
  total_revenue DECIMAL,
  total_cost DECIMAL,
  total_margin DECIMAL,
  margin_percentage DECIMAL
) AS $$
DECLARE
  v_start_date DATE := COALESCE(p_start_date, CURRENT_DATE - INTERVAL '7 days');
  v_end_date DATE := COALESCE(p_end_date, CURRENT_DATE);
BEGIN
  RETURN QUERY
  SELECT 
    mi.id AS menu_item_id,
    mi.name AS menu_item_name,
    COALESCE(SUM(si.quantity), 0) AS quantity_sold,
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
    AND DATE(s.sale_date) BETWEEN v_start_date AND v_end_date
    AND s.payment_status != 'refunded'
  ) si ON mi.id = si.menu_item_id
  WHERE mi.tenant_id = p_tenant_id
  GROUP BY mi.id, mi.name, mi.total_cost
  ORDER BY quantity_sold DESC;
END;
$$ LANGUAGE plpgsql;

-- Update get_ingredient_cost_trends to use date range
CREATE OR REPLACE FUNCTION get_ingredient_cost_trends(p_tenant_id UUID, p_start_date DATE DEFAULT NULL, p_end_date DATE DEFAULT NULL)
RETURNS TABLE (
  ingredient_id UUID,
  ingredient_name VARCHAR,
  unit VARCHAR,
  avg_cost_per_unit DECIMAL,
  total_purchased DECIMAL,
  last_cost_per_unit DECIMAL,
  cost_change_percentage DECIMAL
) AS $$
DECLARE
  v_start_date DATE := COALESCE(p_start_date, CURRENT_DATE - INTERVAL '30 days');
  v_end_date DATE := COALESCE(p_end_date, CURRENT_DATE);
BEGIN
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
        ingredient_id,
        SUM(quantity) as total_qty,
        SUM(quantity * unit_price) as total_cost
    FROM purchase_data
    GROUP BY ingredient_id
  ),
  ingredient_data AS (
    SELECT 
      i.id,
      i.name,
      i.unit,
      i.cost_per_unit AS current_cost
    FROM ingredients i
    WHERE i.tenant_id = p_tenant_id
  )
  SELECT 
    id.id AS ingredient_id,
    id.name AS ingredient_name,
    id.unit AS unit,
    CAST(COALESCE(
        CASE WHEN ps.total_qty > 0 THEN ps.total_cost / ps.total_qty ELSE id.current_cost END, 
        id.current_cost
    ) AS DECIMAL) AS avg_cost_per_unit,
    CAST(COALESCE(ps.total_qty, 0) AS DECIMAL) AS total_purchased,
    id.current_cost AS last_cost_per_unit,
    CAST(CASE 
      WHEN COALESCE(
          CASE WHEN ps.total_qty > 0 THEN ps.total_cost / ps.total_qty ELSE id.current_cost END, 
          id.current_cost
      ) > 0 
      THEN (
          (id.current_cost - COALESCE(
              CASE WHEN ps.total_qty > 0 THEN ps.total_cost / ps.total_qty ELSE id.current_cost END, 
              id.current_cost
          )) 
          / 
          COALESCE(
              CASE WHEN ps.total_qty > 0 THEN ps.total_cost / ps.total_qty ELSE id.current_cost END, 
              id.current_cost
          )
      ) * 100
      ELSE 0
    END AS DECIMAL) AS cost_change_percentage
  FROM ingredient_data id
  LEFT JOIN ingredient_stats ps ON id.id = ps.ingredient_id
  ORDER BY cost_change_percentage DESC;
END;
$$ LANGUAGE plpgsql;

-- Drop old functions with signature mismatch if necessary, but overloading might handle it.
-- However, since we changed parameter names/types significantly (p_days -> dates), it's better to explicitly drop the old ones to avoid confusion or ambiguity if p_days default was removed.
-- Actually, Postgres allows function overloading. But let's be clean.
DROP FUNCTION IF EXISTS get_menu_performance(UUID, INTEGER);
DROP FUNCTION IF EXISTS get_ingredient_cost_trends(UUID, INTEGER);
