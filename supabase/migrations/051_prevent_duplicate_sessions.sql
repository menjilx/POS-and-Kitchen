-- Create atomic RPC function for opening cashier session to prevent duplicate sessions
-- This prevents multiple open sessions from being created due to race conditions

CREATE OR REPLACE FUNCTION open_cashier_session(
  p_tenant_id UUID,
  p_user_id UUID,
  p_opening_amount NUMERIC,
  p_notes TEXT
)
RETURNS JSON
LANGUAGE plpgsql
AS $$
DECLARE
  v_result JSON;
  v_session RECORD;
BEGIN
  -- Check if session already exists
  SELECT * INTO v_session
  FROM cashier_sessions
  WHERE user_id = p_user_id AND status = 'open'
  LIMIT 1;
  
  IF v_session.id IS NOT NULL THEN
    RETURN json_build_object(
      'success', false,
      'error', 'OPEN_SESSION_EXISTS',
      'session_id', v_session.id,
      'opening_time', v_session.opening_time,
      'message', 'You already have an open register session'
    );
  END IF;
  
  -- Insert new session
  INSERT INTO cashier_sessions (
    tenant_id, user_id, opening_amount, notes,
    status, opening_time
  ) VALUES (
    p_tenant_id, p_user_id, p_opening_amount, p_notes,
    'open', NOW()
  )
  RETURNING 
    json_build_object(
      'success', true,
      'session_id', id,
      'tenant_id', tenant_id,
      'user_id', user_id,
      'status', status,
      'opening_time', opening_time
    ) INTO v_result;
  
  RETURN v_result;
EXCEPTION WHEN OTHERS THEN
  RETURN json_build_object(
    'success', false,
    'error', SQLERRM,
    'message', 'Failed to open register session'
  );
END;
$$;

-- Create index to enforce one open session per user at database level
-- This provides additional protection against duplicates
CREATE UNIQUE INDEX IF NOT EXISTS idx_one_open_session_per_user
ON cashier_sessions (user_id) 
WHERE status = 'open';

COMMENT ON FUNCTION open_cashier_session IS 'Atomically opens a cashier session, preventing duplicate open sessions per user';
COMMENT ON INDEX idx_one_open_session_per_user IS 'Ensures only one open session per user at a time';
