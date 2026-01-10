-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Supabase Realtime extension is optional and not available on all plans
-- CREATE EXTENSION IF NOT EXISTS "supabase_realtime";

-- ============================================
-- TENANTS
-- ============================================
CREATE TABLE tenants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- USERS (Supabase Auth profiles)
-- ============================================
CREATE TABLE users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  email VARCHAR(255) NOT NULL,
  full_name VARCHAR(255),
  role VARCHAR(20) NOT NULL CHECK (role IN ('owner', 'manager', 'staff')),
  status VARCHAR(20) NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'deactivated')),
  last_login TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(email, tenant_id)
);

-- ============================================
-- INGREDIENT CATEGORIES
-- ============================================
CREATE TABLE ingredient_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  name VARCHAR(100) NOT NULL,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(tenant_id, name)
);

-- ============================================
-- INGREDIENTS
-- ============================================
CREATE TABLE ingredients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  category_id UUID REFERENCES ingredient_categories(id) ON DELETE SET NULL,
  name VARCHAR(255) NOT NULL,
  unit VARCHAR(50) NOT NULL,
  cost_per_unit DECIMAL(10, 2) NOT NULL DEFAULT 0,
  reorder_level DECIMAL(10, 2) DEFAULT 10,
  status VARCHAR(20) NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'deactivated')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(tenant_id, name)
);

-- ============================================
-- LOCATIONS
-- ============================================
CREATE TABLE locations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  name VARCHAR(100) NOT NULL,
  address TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(tenant_id, name)
);

-- ============================================
-- STOCK
-- ============================================
CREATE TABLE stock (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  ingredient_id UUID NOT NULL REFERENCES ingredients(id) ON DELETE CASCADE,
  location_id UUID NOT NULL REFERENCES locations(id) ON DELETE CASCADE,
  quantity DECIMAL(10, 2) NOT NULL DEFAULT 0,
  last_updated TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(ingredient_id, location_id)
);

-- ============================================
-- STOCK ADJUSTMENTS
-- ============================================
CREATE TABLE stock_adjustments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  ingredient_id UUID NOT NULL REFERENCES ingredients(id) ON DELETE CASCADE,
  location_id UUID NOT NULL REFERENCES locations(id) ON DELETE CASCADE,
  adjustment_type VARCHAR(20) NOT NULL CHECK (adjustment_type IN ('purchase', 'sale', 'waste', 'stocktake', 'adjustment')),
  quantity DECIMAL(10, 2) NOT NULL,
  reference_id UUID, -- Links to purchases, sales, stocktakes
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES users(id)
);

-- ============================================
-- STOCKTAKES
-- ============================================
CREATE TABLE stocktakes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  location_id UUID NOT NULL REFERENCES locations(id) ON DELETE CASCADE,
  date TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  performed_by UUID NOT NULL REFERENCES users(id),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- STOCKTAKE ITEMS
-- ============================================
CREATE TABLE stocktake_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  stocktake_id UUID NOT NULL REFERENCES stocktakes(id) ON DELETE CASCADE,
  ingredient_id UUID NOT NULL REFERENCES ingredients(id) ON DELETE CASCADE,
  expected_quantity DECIMAL(10, 2) NOT NULL,
  actual_quantity DECIMAL(10, 2) NOT NULL,
  variance DECIMAL(10, 2) DEFAULT 0,
  variance_percentage DECIMAL(10, 2) DEFAULT 0
);

-- ============================================
-- MENU ITEMS
-- ============================================
CREATE TABLE menu_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  category VARCHAR(100),
  selling_price DECIMAL(10, 2) NOT NULL DEFAULT 0,
  waste_percentage DECIMAL(5, 2) DEFAULT 0,
  labor_cost DECIMAL(10, 2) DEFAULT 0,
  total_cost DECIMAL(10, 2) DEFAULT 0,
  contribution_margin DECIMAL(10, 2) DEFAULT 0,
  status VARCHAR(20) NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'deactivated')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- RECIPE ITEMS
-- ============================================
CREATE TABLE recipe_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  menu_item_id UUID NOT NULL REFERENCES menu_items(id) ON DELETE CASCADE,
  ingredient_id UUID NOT NULL REFERENCES ingredients(id) ON DELETE CASCADE,
  quantity DECIMAL(10, 2) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(menu_item_id, ingredient_id)
);

-- ============================================
-- SUPPLIERS
-- ============================================
CREATE TABLE suppliers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  contact_person VARCHAR(255),
  email VARCHAR(255),
  phone VARCHAR(50),
  address TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(tenant_id, name)
);

-- ============================================
-- PURCHASES
-- ============================================
CREATE TABLE purchases (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  supplier_id UUID REFERENCES suppliers(id) ON DELETE SET NULL,
  invoice_number VARCHAR(100),
  invoice_date DATE NOT NULL DEFAULT CURRENT_DATE,
  total_amount DECIMAL(10, 2) NOT NULL DEFAULT 0,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID NOT NULL REFERENCES users(id)
);

-- ============================================
-- PURCHASE ITEMS
-- ============================================
CREATE TABLE purchase_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  purchase_id UUID NOT NULL REFERENCES purchases(id) ON DELETE CASCADE,
  ingredient_id UUID NOT NULL REFERENCES ingredients(id) ON DELETE CASCADE,
  quantity DECIMAL(10, 2) NOT NULL,
  unit_price DECIMAL(10, 2) NOT NULL,
  total_price DECIMAL(10, 2) DEFAULT 0,
  location_id UUID NOT NULL REFERENCES locations(id) ON DELETE CASCADE
);

-- ============================================
-- TABLES (for Reservations)
-- ============================================
CREATE TABLE tables (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  table_number VARCHAR(50) NOT NULL,
  capacity INTEGER NOT NULL,
  location VARCHAR(100),
  status VARCHAR(20) NOT NULL DEFAULT 'available' CHECK (status IN ('available', 'occupied', 'reserved', 'cleaning')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(tenant_id, table_number)
);

-- ============================================
-- RESERVATIONS
-- ============================================
CREATE TABLE reservations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  table_id UUID NOT NULL REFERENCES tables(id) ON DELETE CASCADE,
  customer_name VARCHAR(255) NOT NULL,
  customer_phone VARCHAR(50),
  customer_email VARCHAR(255),
  party_size INTEGER NOT NULL,
  reservation_time TIMESTAMPTZ NOT NULL,
  duration_minutes INTEGER DEFAULT 90,
  status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'seated', 'completed', 'cancelled', 'no_show')),
  special_requests TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- SALES
-- ============================================
CREATE TABLE sales (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  order_number VARCHAR(50) NOT NULL,
  sale_type VARCHAR(20) NOT NULL CHECK (sale_type IN ('dine_in', 'takeout', 'delivery')),
  table_id UUID REFERENCES tables(id) ON DELETE SET NULL,
  reservation_id UUID REFERENCES reservations(id) ON DELETE SET NULL,
  total_amount DECIMAL(10, 2) NOT NULL DEFAULT 0,
  payment_method VARCHAR(50) CHECK (payment_method IN ('cash', 'card', 'ewallet', 'bank_transfer')),
  payment_status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (payment_status IN ('pending', 'partial', 'paid', 'refunded')),
  payment_notes TEXT,
  tip_amount DECIMAL(10, 2) DEFAULT 0,
  payment_data JSONB DEFAULT '{}',
  notes TEXT,
  sale_date DATE NOT NULL DEFAULT CURRENT_DATE,
  sale_time TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID NOT NULL REFERENCES users(id),
  UNIQUE(tenant_id, order_number)
);

-- ============================================
-- SALE ITEMS
-- ============================================
CREATE TABLE sale_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sale_id UUID NOT NULL REFERENCES sales(id) ON DELETE CASCADE,
  menu_item_id UUID NOT NULL REFERENCES menu_items(id) ON DELETE CASCADE,
  quantity INTEGER NOT NULL DEFAULT 1,
  unit_price DECIMAL(10, 2) NOT NULL,
  total_price DECIMAL(10, 2) DEFAULT 0,
  notes TEXT
);

-- ============================================
-- KDS ORDERS (Kitchen Display System)
-- ============================================
CREATE TABLE kds_orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  sale_id UUID NOT NULL REFERENCES sales(id) ON DELETE CASCADE,
  order_number VARCHAR(50) NOT NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'preparing', 'ready', 'served', 'cancelled')),
  priority VARCHAR(20) NOT NULL DEFAULT 'normal' CHECK (priority IN ('normal', 'high', 'urgent')),
  assigned_station VARCHAR(100),
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- KDS ORDER ITEMS
-- ============================================
CREATE TABLE kds_order_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  kds_order_id UUID NOT NULL REFERENCES kds_orders(id) ON DELETE CASCADE,
  menu_item_id UUID NOT NULL REFERENCES menu_items(id) ON DELETE CASCADE,
  quantity INTEGER NOT NULL DEFAULT 1,
  notes TEXT,
  status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'preparing', 'ready'))
);

-- ============================================
-- EXPENSE CATEGORIES
-- ============================================
CREATE TABLE expense_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  name VARCHAR(100) NOT NULL,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(tenant_id, name)
);

-- ============================================
-- EXPENSES
-- ============================================
CREATE TABLE expenses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  category_id UUID NOT NULL REFERENCES expense_categories(id) ON DELETE CASCADE,
  description VARCHAR(255) NOT NULL,
  amount DECIMAL(10, 2) NOT NULL,
  expense_date DATE NOT NULL DEFAULT CURRENT_DATE,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID NOT NULL REFERENCES users(id)
);

-- ============================================
-- TRIGGERS FOR CALCULATED FIELDS
-- ============================================

-- Function to update stocktake variance
CREATE OR REPLACE FUNCTION update_stocktake_variance()
RETURNS TRIGGER AS $$
BEGIN
  NEW.variance := NEW.actual_quantity - NEW.expected_quantity;
  NEW.variance_percentage := CASE 
    WHEN NEW.expected_quantity = 0 THEN 0
    ELSE ((NEW.actual_quantity - NEW.expected_quantity) / NEW.expected_quantity) * 100
  END;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_stocktake_variance
  BEFORE INSERT OR UPDATE ON stocktake_items
  FOR EACH ROW
  EXECUTE FUNCTION update_stocktake_variance();

-- Function to update menu item cost and margin
CREATE OR REPLACE FUNCTION update_menu_item_cost()
RETURNS TRIGGER AS $$
DECLARE
  v_total_cost DECIMAL(10, 2);
BEGIN
  IF NEW.id IS NULL THEN
    NEW.total_cost := 0;
    NEW.contribution_margin := NEW.selling_price - NEW.labor_cost;
  ELSE
    -- Calculate food cost from recipe
    SELECT COALESCE(SUM(
      (ri.quantity * i.cost_per_unit) * (1 + NEW.waste_percentage / 100)
    ), 0)
    INTO v_total_cost
    FROM recipe_items ri
    JOIN ingredients i ON ri.ingredient_id = i.id
    WHERE ri.menu_item_id = NEW.id;
    
    -- Total cost = food cost + labor
    NEW.total_cost := COALESCE(v_total_cost, 0) + NEW.labor_cost;
    NEW.contribution_margin := NEW.selling_price - NEW.total_cost;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_menu_item_cost
  BEFORE INSERT OR UPDATE OF selling_price, waste_percentage, labor_cost ON menu_items
  FOR EACH ROW
  EXECUTE FUNCTION update_menu_item_cost();

-- Function to update purchase item total
CREATE OR REPLACE FUNCTION update_purchase_item_total()
RETURNS TRIGGER AS $$
BEGIN
  NEW.total_price := NEW.quantity * NEW.unit_price;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_purchase_item_total
  BEFORE INSERT OR UPDATE ON purchase_items
  FOR EACH ROW
  EXECUTE FUNCTION update_purchase_item_total();

-- Function to update sale item total
CREATE OR REPLACE FUNCTION update_sale_item_total()
RETURNS TRIGGER AS $$
BEGIN
  NEW.total_price := NEW.quantity * NEW.unit_price;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_sale_item_total
  BEFORE INSERT OR UPDATE ON sale_items
  FOR EACH ROW
  EXECUTE FUNCTION update_sale_item_total();

-- ============================================
-- INDEXES
-- ============================================
CREATE INDEX idx_users_tenant ON users(tenant_id);
CREATE INDEX idx_ingredients_tenant ON ingredients(tenant_id);
CREATE INDEX idx_stock_tenant ON stock(tenant_id);
CREATE INDEX idx_menu_items_tenant ON menu_items(tenant_id);
CREATE INDEX idx_sales_tenant ON sales(tenant_id);
CREATE INDEX idx_kds_orders_tenant ON kds_orders(tenant_id);
CREATE INDEX idx_reservations_tenant ON reservations(tenant_id);
CREATE INDEX idx_reservations_time ON reservations(reservation_time);
CREATE INDEX idx_tables_tenant ON tables(tenant_id);
CREATE INDEX idx_stock_adjustments_tenant ON stock_adjustments(tenant_id);
CREATE INDEX idx_stock_adjustments_ingredient ON stock_adjustments(ingredient_id);
CREATE INDEX idx_purchases_tenant ON purchases(tenant_id);
CREATE INDEX idx_purchases_date ON purchases(invoice_date);
CREATE INDEX idx_expenses_tenant ON expenses(tenant_id);
CREATE INDEX idx_expenses_date ON expenses(expense_date);
