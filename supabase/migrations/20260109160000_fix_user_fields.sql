-- Fix get_user_by_token to return date_of_birth and avatar fields
CREATE OR REPLACE FUNCTION get_user_by_token(
  p_token TEXT
) RETURNS JSON AS $$
DECLARE
  v_user RECORD;
  v_session RECORD;
BEGIN
  SELECT * INTO v_session FROM app_sessions WHERE token = p_token AND expires_at > NOW();

  IF v_session IS NULL THEN
    RETURN json_build_object('success', false);
  END IF;

  -- Include date_of_birth and avatar in the SELECT
  SELECT id, email, phone, full_name, date_of_birth, avatar, is_admin, created_at 
  INTO v_user 
  FROM app_users 
  WHERE id = v_session.user_id;

  RETURN json_build_object(
    'success', true,
    'user', row_to_json(v_user)
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Also fix verify_otp to return date_of_birth and avatar
CREATE OR REPLACE FUNCTION verify_otp(
  p_phone TEXT,
  p_code TEXT
) RETURNS JSON AS $$
DECLARE
  v_otp RECORD;
  v_user RECORD;
  v_token TEXT;
  v_expires_at TIMESTAMPTZ;
  v_is_new_user BOOLEAN := FALSE;
BEGIN
  -- Find valid OTP
  SELECT * INTO v_otp
  FROM otp_codes
  WHERE phone = p_phone 
    AND code = p_code 
    AND used = FALSE 
    AND expires_at > NOW()
  ORDER BY created_at DESC 
  LIMIT 1;

  IF v_otp IS NULL THEN
    RETURN json_build_object('success', false, 'message', 'Invalid or expired OTP');
  END IF;

  -- Mark OTP as used
  UPDATE otp_codes SET used = TRUE WHERE id = v_otp.id;

  -- Check if user EXISTS in database BEFORE creating
  SELECT * INTO v_user FROM app_users WHERE phone = p_phone;

  IF v_user IS NULL THEN
    -- Phone number NOT in database - this is a NEW user
    v_is_new_user := TRUE;
    INSERT INTO app_users (phone) VALUES (p_phone)
    RETURNING * INTO v_user;
  ELSE
    -- Phone number EXISTS in database - check if profile is complete
    v_is_new_user := (v_user.full_name IS NULL OR v_user.full_name = '');
  END IF;

  -- Create Session
  v_token := encode(gen_random_bytes(32), 'hex');
  v_expires_at := NOW() + INTERVAL '30 days';

  INSERT INTO app_sessions (user_id, token, expires_at)
  VALUES (v_user.id, v_token, v_expires_at);

  RETURN json_build_object(
    'success', true,
    'user', json_build_object(
      'id', v_user.id,
      'email', v_user.email,
      'phone', v_user.phone,
      'full_name', v_user.full_name,
      'date_of_birth', v_user.date_of_birth,
      'avatar', v_user.avatar,
      'is_admin', v_user.is_admin,
      'created_at', v_user.created_at
    ),
    'token', v_token,
    'is_new_user', v_is_new_user
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
