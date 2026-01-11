
-- ============================================
-- CASHIER SESSIONS
-- ============================================
CREATE TABLE cashier_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  opening_amount DECIMAL(10, 2) NOT NULL DEFAULT 0,
  closing_amount DECIMAL(10, 2),
  expected_cash_amount DECIMAL(10, 2),
  opening_time TIMESTAMPTZ DEFAULT NOW(),
  closing_time TIMESTAMPTZ,
  status VARCHAR(20) NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'closed')),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add RLS policies
ALTER TABLE cashier_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view sessions for their tenant" ON cashier_sessions
  FOR SELECT USING (tenant_id = (SELECT tenant_id FROM users WHERE id = auth.uid()));

CREATE POLICY "Users can insert their own sessions" ON cashier_sessions
  FOR INSERT WITH CHECK (
    tenant_id = (SELECT tenant_id FROM users WHERE id = auth.uid()) AND
    user_id = auth.uid()
  );

CREATE POLICY "Users can update their own open sessions" ON cashier_sessions
  FOR UPDATE USING (
    tenant_id = (SELECT tenant_id FROM users WHERE id = auth.uid()) AND
    user_id = auth.uid()
  );
