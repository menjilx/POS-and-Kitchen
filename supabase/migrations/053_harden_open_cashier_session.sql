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
  v_tenant_id UUID;
BEGIN
  IF auth.uid() IS NULL THEN
    RETURN json_build_object(
      'success', false,
      'error', 'UNAUTHORIZED',
      'message', 'Authentication required'
    );
  END IF;

  IF p_user_id IS NULL OR p_user_id <> auth.uid() THEN
    RETURN json_build_object(
      'success', false,
      'error', 'UNAUTHORIZED',
      'message', 'Unauthorized to open register session'
    );
  END IF;

  v_tenant_id := get_current_user_tenant_id();
  IF v_tenant_id IS NULL THEN
    RETURN json_build_object(
      'success', false,
      'error', 'NO_TENANT',
      'message', 'No tenant found for user'
    );
  END IF;

  IF p_tenant_id IS NULL OR p_tenant_id <> v_tenant_id THEN
    RETURN json_build_object(
      'success', false,
      'error', 'TENANT_MISMATCH',
      'message', 'Tenant mismatch'
    );
  END IF;

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

  INSERT INTO cashier_sessions (
    tenant_id, user_id, opening_amount, notes,
    status, opening_time
  ) VALUES (
    v_tenant_id, auth.uid(), p_opening_amount, p_notes,
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
EXCEPTION 
  WHEN unique_violation THEN
    RETURN json_build_object(
      'success', false,
      'error', 'OPEN_SESSION_EXISTS',
      'message', 'You already have an open register session'
    );
  WHEN OTHERS THEN
    RETURN json_build_object(
      'success', false,
      'error', SQLERRM,
      'message', 'Failed to open register session'
    );
END;
$$;
