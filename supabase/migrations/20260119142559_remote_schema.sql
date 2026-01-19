set check_function_bodies = off;

CREATE OR REPLACE FUNCTION public.get_ingredient_cost_trends(p_tenant_id uuid, p_start_date date DEFAULT NULL::date, p_end_date date DEFAULT NULL::date)
 RETURNS TABLE(ingredient_id uuid, ingredient_name character varying, unit character varying, avg_cost_per_unit numeric, total_purchased numeric, last_cost_per_unit numeric, cost_change_percentage numeric)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
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
$function$
;


