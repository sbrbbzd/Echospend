-- Add Google Login function (analogous to Apple login)
CREATE OR REPLACE FUNCTION login_google(
  p_google_id TEXT,
  p_email TEXT DEFAULT NULL,
  p_full_name TEXT DEFAULT NULL
) RETURNS JSON AS $$
DECLARE
  v_user RECORD;
  v_token TEXT;
  v_expires_at TIMESTAMPTZ;
BEGIN
  -- First, try to add google_id column if it doesn't exist
  BEGIN
    ALTER TABLE app_users ADD COLUMN IF NOT EXISTS google_id TEXT UNIQUE;
  EXCEPTION WHEN OTHERS THEN
    -- Column might already exist, continue
    NULL;
  END;

  -- Find User by Google ID
  SELECT * INTO v_user FROM app_users WHERE google_id = p_google_id;

  IF v_user IS NULL THEN
    -- Try finding by email if provided to link accounts
    IF p_email IS NOT NULL THEN
      SELECT * INTO v_user FROM app_users WHERE email = p_email;
    END IF;

    IF v_user IS NOT NULL THEN
      -- Link Google ID to existing user
      UPDATE app_users SET google_id = p_google_id WHERE id = v_user.id
      RETURNING * INTO v_user;
    ELSE
      -- Create new user
      INSERT INTO app_users (google_id, email, full_name)
      VALUES (p_google_id, p_email, p_full_name)
      RETURNING * INTO v_user;
    END IF;
  ELSE
    -- Update info if provided
    IF p_email IS NOT NULL OR p_full_name IS NOT NULL THEN
       UPDATE app_users 
       SET email = COALESCE(p_email, email),
           full_name = COALESCE(p_full_name, full_name)
       WHERE id = v_user.id
       RETURNING * INTO v_user;
    END IF;
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
      'is_admin', v_user.is_admin,
      'created_at', v_user.created_at
    ),
    'token', v_token
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Also add google_id column to app_users if not exists
ALTER TABLE app_users ADD COLUMN IF NOT EXISTS google_id TEXT UNIQUE;
