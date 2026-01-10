-- ============================================
-- ROW LEVEL SECURITY POLICIES
-- ============================================

-- Enable RLS on all tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE tenants ENABLE ROW LEVEL SECURITY;
ALTER TABLE ingredient_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE ingredients ENABLE ROW LEVEL SECURITY;
ALTER TABLE locations ENABLE ROW LEVEL SECURITY;
ALTER TABLE stock ENABLE ROW LEVEL SECURITY;
ALTER TABLE stock_adjustments ENABLE ROW LEVEL SECURITY;
ALTER TABLE stocktakes ENABLE ROW LEVEL SECURITY;
ALTER TABLE stocktake_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE menu_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE recipe_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE suppliers ENABLE ROW LEVEL SECURITY;
ALTER TABLE purchases ENABLE ROW LEVEL SECURITY;
ALTER TABLE purchase_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE tables ENABLE ROW LEVEL SECURITY;
ALTER TABLE reservations ENABLE ROW LEVEL SECURITY;
ALTER TABLE sales ENABLE ROW LEVEL SECURITY;
ALTER TABLE sale_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE kds_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE kds_order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE expense_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE expenses ENABLE ROW LEVEL SECURITY;

-- ============================================
-- TENANTS POLICY
-- ============================================
CREATE POLICY "Users can view their own tenant"
  ON tenants FOR SELECT
  USING (id IN (SELECT tenant_id FROM users WHERE id = auth.uid()));

-- ============================================
-- USERS POLICY
-- ============================================
CREATE POLICY "Users can view users in their tenant"
  ON users FOR SELECT
  USING (tenant_id IN (SELECT tenant_id FROM users WHERE id = auth.uid()));

CREATE POLICY "Only owners can manage users"
  ON users FOR ALL
  USING (
    tenant_id IN (SELECT tenant_id FROM users WHERE id = auth.uid())
    AND EXISTS (
      SELECT 1 FROM users WHERE id = auth.uid() AND role = 'owner'
    )
  );

-- ============================================
-- INGREDIENT CATEGORIES POLICY
-- ============================================
CREATE POLICY "Users can view ingredient categories in their tenant"
  ON ingredient_categories FOR SELECT
  USING (tenant_id IN (SELECT tenant_id FROM users WHERE id = auth.uid()));

CREATE POLICY "Owners and managers can manage ingredient categories"
  ON ingredient_categories FOR ALL
  USING (
    tenant_id IN (SELECT tenant_id FROM users WHERE id = auth.uid())
    AND EXISTS (
      SELECT 1 FROM users WHERE id = auth.uid() AND role IN ('owner', 'manager')
    )
  );

-- ============================================
-- INGREDIENTS POLICY
-- ============================================
CREATE POLICY "Users can view ingredients in their tenant"
  ON ingredients FOR SELECT
  USING (tenant_id IN (SELECT tenant_id FROM users WHERE id = auth.uid()));

CREATE POLICY "Owners and managers can manage ingredients"
  ON ingredients FOR ALL
  USING (
    tenant_id IN (SELECT tenant_id FROM users WHERE id = auth.uid())
    AND EXISTS (
      SELECT 1 FROM users WHERE id = auth.uid() AND role IN ('owner', 'manager')
    )
  );

-- ============================================
-- LOCATIONS POLICY
-- ============================================
CREATE POLICY "Users can view locations in their tenant"
  ON locations FOR SELECT
  USING (tenant_id IN (SELECT tenant_id FROM users WHERE id = auth.uid()));

CREATE POLICY "Owners and managers can manage locations"
  ON locations FOR ALL
  USING (
    tenant_id IN (SELECT tenant_id FROM users WHERE id = auth.uid())
    AND EXISTS (
      SELECT 1 FROM users WHERE id = auth.uid() AND role IN ('owner', 'manager')
    )
  );

-- ============================================
-- STOCK POLICY
-- ============================================
CREATE POLICY "Users can view stock in their tenant"
  ON stock FOR SELECT
  USING (tenant_id IN (SELECT tenant_id FROM users WHERE id = auth.uid()));

CREATE POLICY "Owners and managers can manage stock"
  ON stock FOR ALL
  USING (
    tenant_id IN (SELECT tenant_id FROM users WHERE id = auth.uid())
    AND EXISTS (
      SELECT 1 FROM users WHERE id = auth.uid() AND role IN ('owner', 'manager')
    )
  );

-- ============================================
-- STOCK ADJUSTMENTS POLICY
-- ============================================
CREATE POLICY "Users can view stock adjustments in their tenant"
  ON stock_adjustments FOR SELECT
  USING (tenant_id IN (SELECT tenant_id FROM users WHERE id = auth.uid()));

CREATE POLICY "Owners and managers can create stock adjustments"
  ON stock_adjustments FOR INSERT
  WITH CHECK (
    tenant_id IN (SELECT tenant_id FROM users WHERE id = auth.uid())
    AND EXISTS (
      SELECT 1 FROM users WHERE id = auth.uid() AND role IN ('owner', 'manager', 'staff')
    )
  );

-- ============================================
-- STOCKTAKES POLICY
-- ============================================
CREATE POLICY "Users can view stocktakes in their tenant"
  ON stocktakes FOR SELECT
  USING (tenant_id IN (SELECT tenant_id FROM users WHERE id = auth.uid()));

CREATE POLICY "Users can create stocktakes"
  ON stocktakes FOR INSERT
  WITH CHECK (
    tenant_id IN (SELECT tenant_id FROM users WHERE id = auth.uid())
    AND EXISTS (
      SELECT 1 FROM users WHERE id = auth.uid() AND role IN ('owner', 'manager', 'staff')
    )
  );

-- ============================================
-- MENU ITEMS POLICY
-- ============================================
CREATE POLICY "Users can view menu items in their tenant"
  ON menu_items FOR SELECT
  USING (tenant_id IN (SELECT tenant_id FROM users WHERE id = auth.uid()));

CREATE POLICY "Owners and managers can manage menu items"
  ON menu_items FOR ALL
  USING (
    tenant_id IN (SELECT tenant_id FROM users WHERE id = auth.uid())
    AND EXISTS (
      SELECT 1 FROM users WHERE id = auth.uid() AND role IN ('owner', 'manager')
    )
  );

-- ============================================
-- RECIPE ITEMS POLICY
-- ============================================
CREATE POLICY "Users can view recipe items in their tenant"
  ON recipe_items FOR SELECT
  USING (
    menu_item_id IN (
      SELECT id FROM menu_items 
      WHERE tenant_id IN (SELECT tenant_id FROM users WHERE id = auth.uid())
    )
  );

-- ============================================
-- SUPPLIERS POLICY
-- ============================================
CREATE POLICY "Users can view suppliers in their tenant"
  ON suppliers FOR SELECT
  USING (tenant_id IN (SELECT tenant_id FROM users WHERE id = auth.uid()));

CREATE POLICY "Owners and managers can manage suppliers"
  ON suppliers FOR ALL
  USING (
    tenant_id IN (SELECT tenant_id FROM users WHERE id = auth.uid())
    AND EXISTS (
      SELECT 1 FROM users WHERE id = auth.uid() AND role IN ('owner', 'manager')
    )
  );

-- ============================================
-- PURCHASES POLICY
-- ============================================
CREATE POLICY "Users can view purchases in their tenant"
  ON purchases FOR SELECT
  USING (tenant_id IN (SELECT tenant_id FROM users WHERE id = auth.uid()));

CREATE POLICY "Users can create purchases"
  ON purchases FOR INSERT
  WITH CHECK (
    tenant_id IN (SELECT tenant_id FROM users WHERE id = auth.uid())
    AND EXISTS (
      SELECT 1 FROM users WHERE id = auth.uid() AND role IN ('owner', 'manager', 'staff')
    )
  );

-- ============================================
-- PURCHASE ITEMS POLICY
-- ============================================
CREATE POLICY "Users can view purchase items in their tenant"
  ON purchase_items FOR SELECT
  USING (
    purchase_id IN (
      SELECT id FROM purchases 
      WHERE tenant_id IN (SELECT tenant_id FROM users WHERE id = auth.uid())
    )
  );

-- ============================================
-- TABLES POLICY
-- ============================================
CREATE POLICY "Users can view tables in their tenant"
  ON tables FOR SELECT
  USING (tenant_id IN (SELECT tenant_id FROM users WHERE id = auth.uid()));

CREATE POLICY "Owners and managers can manage tables"
  ON tables FOR ALL
  USING (
    tenant_id IN (SELECT tenant_id FROM users WHERE id = auth.uid())
    AND EXISTS (
      SELECT 1 FROM users WHERE id = auth.uid() AND role IN ('owner', 'manager')
    )
  );

-- ============================================
-- RESERVATIONS POLICY
-- ============================================
CREATE POLICY "Users can view reservations in their tenant"
  ON reservations FOR SELECT
  USING (tenant_id IN (SELECT tenant_id FROM users WHERE id = auth.uid()));

CREATE POLICY "Owners and managers can manage reservations"
  ON reservations FOR ALL
  USING (
    tenant_id IN (SELECT tenant_id FROM users WHERE id = auth.uid())
    AND EXISTS (
      SELECT 1 FROM users WHERE id = auth.uid() AND role IN ('owner', 'manager')
    )
  );

-- ============================================
-- SALES POLICY
-- ============================================
CREATE POLICY "Users can view sales in their tenant"
  ON sales FOR SELECT
  USING (tenant_id IN (SELECT tenant_id FROM users WHERE id = auth.uid()));

CREATE POLICY "Users can create sales"
  ON sales FOR INSERT
  WITH CHECK (
    tenant_id IN (SELECT tenant_id FROM users WHERE id = auth.uid())
    AND EXISTS (
      SELECT 1 FROM users WHERE id = auth.uid() AND role IN ('owner', 'manager', 'staff')
    )
  );

CREATE POLICY "Users can update their own sales"
  ON sales FOR UPDATE
  USING (
    tenant_id IN (SELECT tenant_id FROM users WHERE id = auth.uid())
    AND created_by = auth.uid()
    AND EXISTS (
      SELECT 1 FROM users WHERE id = auth.uid() AND role IN ('owner', 'manager', 'staff')
    )
  );

-- ============================================
-- SALE ITEMS POLICY
-- ============================================
CREATE POLICY "Users can view sale items in their tenant"
  ON sale_items FOR SELECT
  USING (
    sale_id IN (
      SELECT id FROM sales 
      WHERE tenant_id IN (SELECT tenant_id FROM users WHERE id = auth.uid())
    )
  );

-- ============================================
-- KDS ORDERS POLICY
-- ============================================
CREATE POLICY "Users can view KDS orders in their tenant"
  ON kds_orders FOR SELECT
  USING (tenant_id IN (SELECT tenant_id FROM users WHERE id = auth.uid()));

CREATE POLICY "Users can update KDS order status"
  ON kds_orders FOR UPDATE
  USING (
    tenant_id IN (SELECT tenant_id FROM users WHERE id = auth.uid())
    AND EXISTS (
      SELECT 1 FROM users WHERE id = auth.uid() AND role IN ('owner', 'manager', 'staff')
    )
  );

-- ============================================
-- KDS ORDER ITEMS POLICY
-- ============================================
CREATE POLICY "Users can view KDS order items in their tenant"
  ON kds_order_items FOR SELECT
  USING (
    kds_order_id IN (
      SELECT id FROM kds_orders 
      WHERE tenant_id IN (SELECT tenant_id FROM users WHERE id = auth.uid())
    )
  );

-- ============================================
-- EXPENSE CATEGORIES POLICY
-- ============================================
CREATE POLICY "Users can view expense categories in their tenant"
  ON expense_categories FOR SELECT
  USING (tenant_id IN (SELECT tenant_id FROM users WHERE id = auth.uid()));

CREATE POLICY "Owners and managers can manage expense categories"
  ON expense_categories FOR ALL
  USING (
    tenant_id IN (SELECT tenant_id FROM users WHERE id = auth.uid())
    AND EXISTS (
      SELECT 1 FROM users WHERE id = auth.uid() AND role IN ('owner', 'manager')
    )
  );

-- ============================================
-- EXPENSES POLICY
-- ============================================
CREATE POLICY "Users can view expenses in their tenant"
  ON expenses FOR SELECT
  USING (tenant_id IN (SELECT tenant_id FROM users WHERE id = auth.uid()));

CREATE POLICY "Owners and managers can manage expenses"
  ON expenses FOR ALL
  USING (
    tenant_id IN (SELECT tenant_id FROM users WHERE id = auth.uid())
    AND EXISTS (
      SELECT 1 FROM users WHERE id = auth.uid() AND role IN ('owner', 'manager')
    )
  );

-- ============================================
-- FUNCTIONS FOR AUTO-GENERATED ORDER NUMBERS
-- ============================================
CREATE OR REPLACE FUNCTION generate_order_number(p_tenant_id UUID)
RETURNS VARCHAR AS $$
DECLARE
  v_count BIGINT;
  v_order_number VARCHAR;
BEGIN
  SELECT COUNT(*) INTO v_count
  FROM sales
  WHERE tenant_id = p_tenant_id AND DATE(sale_time) = CURRENT_DATE;
  
  v_count := v_count + 1;
  v_order_number := 'ORD-' || TO_CHAR(CURRENT_DATE, 'YYYYMMDD') || '-' || LPAD(v_count::TEXT, 4, '0');
  
  RETURN v_order_number;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- FUNCTIONS TO UPDATE STOCK
-- ============================================
CREATE OR REPLACE FUNCTION update_stock_on_purchase()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO stock (
    tenant_id, ingredient_id, location_id, quantity
  )
  SELECT 
    p.tenant_id,
    pi.ingredient_id,
    pi.location_id,
    pi.quantity
  FROM purchase_items pi
  WHERE pi.purchase_id = NEW.id
  ON CONFLICT (ingredient_id, location_id)
  DO UPDATE SET 
    quantity = stock.quantity + EXCLUDED.quantity,
    last_updated = NOW();
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION update_stock_on_sale()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO stock_adjustments (
    tenant_id, ingredient_id, location_id, adjustment_type, quantity, reference_id, created_by
  )
  SELECT 
    NEW.tenant_id,
    ri.ingredient_id,
    (SELECT id FROM locations WHERE tenant_id = NEW.tenant_id LIMIT 1),
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

-- ============================================
-- FUNCTION TO CREATE KDS ORDER FROM SALE
-- ============================================
CREATE OR REPLACE FUNCTION create_kds_order_from_sale()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO kds_orders (
    tenant_id, sale_id, order_number, priority
  )
  VALUES (
    NEW.tenant_id,
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

-- ============================================
-- TRIGGERS
-- ============================================
CREATE TRIGGER trigger_update_stock_on_purchase
  AFTER INSERT ON purchases
  FOR EACH ROW
  EXECUTE FUNCTION update_stock_on_purchase();

CREATE TRIGGER trigger_update_stock_on_sale
  AFTER INSERT ON sales
  FOR EACH ROW
  EXECUTE FUNCTION update_stock_on_sale();

CREATE TRIGGER trigger_create_kds_order
  AFTER INSERT ON sales
  FOR EACH ROW
  EXECUTE FUNCTION create_kds_order_from_sale();

-- ============================================
-- FUNCTION TO UPDATE UPDATED_AT TIMESTAMP
-- ============================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply to relevant tables
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_ingredients_updated_at BEFORE UPDATE ON ingredients
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_menu_items_updated_at BEFORE UPDATE ON menu_items
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_reservations_updated_at BEFORE UPDATE ON reservations
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
