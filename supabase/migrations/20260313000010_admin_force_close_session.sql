-- Admin force-close for stale cashier sessions
-- Only owner/manager can force-close any open session

CREATE OR REPLACE FUNCTION force_close_cashier_session(
  p_session_id UUID,
  p_notes TEXT DEFAULT NULL
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_role VARCHAR;
  v_session RECORD;
  v_final_notes TEXT;
BEGIN
  -- Auth check
  IF auth.uid() IS NULL THEN
    RETURN json_build_object(
      'success', false,
      'error', 'UNAUTHORIZED',
      'message', 'Authentication required'
    );
  END IF;

  -- Role check: only owner or manager
  v_role := get_auth_user_role();
  IF v_role IS NULL OR v_role NOT IN ('owner', 'manager') THEN
    RETURN json_build_object(
      'success', false,
      'error', 'FORBIDDEN',
      'message', 'Only owners and managers can force-close sessions'
    );
  END IF;

  -- Find the session
  SELECT * INTO v_session
  FROM cashier_sessions
  WHERE id = p_session_id AND status = 'open';

  IF v_session.id IS NULL THEN
    RETURN json_build_object(
      'success', false,
      'error', 'SESSION_NOT_FOUND',
      'message', 'No open session found with that ID'
    );
  END IF;

  -- Build notes
  v_final_notes := COALESCE(v_session.notes, '');
  IF length(trim(v_final_notes)) > 0 THEN
    v_final_notes := v_final_notes || ' | ';
  END IF;
  v_final_notes := v_final_notes || '[Force-closed by ' || v_role || ' at ' || NOW()::TEXT || ']';
  IF p_notes IS NOT NULL AND length(trim(p_notes)) > 0 THEN
    v_final_notes := v_final_notes || ' Reason: ' || p_notes;
  END IF;

  -- Close the session
  UPDATE cashier_sessions
  SET status = 'closed',
      closing_time = NOW(),
      closing_amount = opening_amount,
      notes = v_final_notes
  WHERE id = p_session_id;

  RETURN json_build_object(
    'success', true,
    'session_id', p_session_id,
    'message', 'Session force-closed successfully'
  );

EXCEPTION
  WHEN OTHERS THEN
    RETURN json_build_object(
      'success', false,
      'error', SQLERRM,
      'message', 'Failed to force-close session'
    );
END;
$$;

-- Also allow owner/manager to update any cashier session (needed for force-close)
CREATE POLICY "Owners and managers can update any cashier session"
  ON cashier_sessions FOR UPDATE
  USING (get_auth_user_role() IN ('owner', 'manager'));

COMMENT ON FUNCTION force_close_cashier_session(UUID, TEXT) IS 'Allows owner/manager to force-close any open cashier session';
