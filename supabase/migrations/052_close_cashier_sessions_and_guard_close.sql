UPDATE cashier_sessions
SET status = 'closed',
    closing_time = NOW(),
    updated_at = NOW()
WHERE status = 'open';

DROP POLICY IF EXISTS "Users can update their own open sessions" ON cashier_sessions;

CREATE POLICY "Users can update their own open sessions" ON cashier_sessions
  FOR UPDATE USING (
    tenant_id = (SELECT tenant_id FROM users WHERE id = auth.uid()) AND
    user_id = auth.uid() AND
    status = 'open'
  )
  WITH CHECK (
    tenant_id = (SELECT tenant_id FROM users WHERE id = auth.uid()) AND
    user_id = auth.uid()
  );

CREATE OR REPLACE FUNCTION close_cashier_session(
  p_user_id UUID,
  p_closing_amount NUMERIC,
  p_notes TEXT
)
RETURNS JSON
LANGUAGE plpgsql
AS $$
DECLARE
  v_result JSON;
  v_session RECORD;
  v_notes TEXT;
BEGIN
  IF p_user_id IS NULL OR p_user_id <> auth.uid() THEN
    RETURN json_build_object(
      'success', false,
      'error', 'UNAUTHORIZED',
      'message', 'Unauthorized to close register session'
    );
  END IF;

  SELECT * INTO v_session
  FROM cashier_sessions
  WHERE user_id = p_user_id AND status = 'open'
  ORDER BY opening_time DESC
  LIMIT 1;

  IF v_session.id IS NULL THEN
    RETURN json_build_object(
      'success', false,
      'error', 'NO_OPEN_SESSION',
      'message', 'No open register session to close'
    );
  END IF;

  IF p_notes IS NULL OR length(trim(p_notes)) = 0 THEN
    v_notes := v_session.notes;
  ELSE
    IF v_session.notes IS NULL OR length(trim(v_session.notes)) = 0 THEN
      v_notes := 'Closing Note: ' || p_notes;
    ELSE
      v_notes := v_session.notes || E'\nClosing Note: ' || p_notes;
    END IF;
  END IF;

  UPDATE cashier_sessions
  SET closing_amount = p_closing_amount,
      closing_time = NOW(),
      status = 'closed',
      notes = v_notes
  WHERE id = v_session.id
  RETURNING json_build_object(
    'success', true,
    'session_id', id,
    'status', status,
    'closing_time', closing_time
  ) INTO v_result;

  RETURN v_result;
EXCEPTION WHEN OTHERS THEN
  RETURN json_build_object(
    'success', false,
    'error', SQLERRM,
    'message', 'Failed to close register session'
  );
END;
$$;
