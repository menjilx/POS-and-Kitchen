-- Add 'voided' to sales.payment_status CHECK constraint
ALTER TABLE sales DROP CONSTRAINT IF EXISTS sales_payment_status_check;
ALTER TABLE sales ADD CONSTRAINT sales_payment_status_check
  CHECK (payment_status IN ('pending', 'partial', 'paid', 'refunded', 'voided'));

-- Create void_requests table
CREATE TABLE IF NOT EXISTS void_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  sale_id uuid NOT NULL REFERENCES sales(id) ON DELETE CASCADE,
  reason text NOT NULL,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'denied')),
  requested_by uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  reviewed_by uuid REFERENCES users(id) ON DELETE SET NULL,
  review_notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  reviewed_at timestamptz
);

ALTER TABLE void_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view void requests"
  ON void_requests FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can create void requests for themselves"
  ON void_requests FOR INSERT
  TO authenticated
  WITH CHECK (requested_by = auth.uid());

CREATE POLICY "Authenticated users can update void requests"
  ON void_requests FOR UPDATE
  TO authenticated
  USING (true);

CREATE INDEX IF NOT EXISTS idx_void_requests_sale_id ON void_requests(sale_id);
CREATE INDEX IF NOT EXISTS idx_void_requests_status ON void_requests(status);

-- Update log_sale_history() to detect 'voided' status
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
