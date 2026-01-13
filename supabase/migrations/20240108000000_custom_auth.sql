-- Enable pgcrypto for password hashing
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Drop existing tables if they exist to rebuild schema
DROP TABLE IF EXISTS app_sessions;
DROP TABLE IF EXISTS app_users;
DROP TABLE IF EXISTS otp_codes;

-- Create app_users table
CREATE TABLE IF NOT EXISTS app_users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT UNIQUE,
  phone TEXT UNIQUE,
  apple_id TEXT UNIQUE,
  password_hash TEXT,
  full_name TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  is_admin BOOLEAN DEFAULT FALSE,
  -- Ensure at least one auth method is present
  CONSTRAINT at_least_one_auth_method CHECK (email IS NOT NULL OR phone IS NOT NULL OR apple_id IS NOT NULL)
);

-- Create app_sessions table
CREATE TABLE IF NOT EXISTS app_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES app_users(id) ON DELETE CASCADE,
  token TEXT UNIQUE NOT NULL,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create otp_codes table for custom OTP
CREATE TABLE IF NOT EXISTS otp_codes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  phone TEXT NOT NULL,
  code TEXT NOT NULL,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  used BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_app_sessions_token ON app_sessions(token);
CREATE INDEX IF NOT EXISTS idx_otp_codes_phone ON otp_codes(phone);

-- Function to register user (Email/Pass)
CREATE OR REPLACE FUNCTION register_user(
  p_email TEXT,
  p_password TEXT,
  p_full_name TEXT
) RETURNS JSON AS $$
DECLARE
  v_user_id UUID;
  v_token TEXT;
  v_expires_at TIMESTAMPTZ;
  v_user RECORD;
BEGIN
  IF EXISTS (SELECT 1 FROM app_users WHERE email = p_email) THEN
    RETURN json_build_object('success', false, 'message', 'Email already registered');
  END IF;

  INSERT INTO app_users (email, password_hash, full_name)
  VALUES (
    p_email,
    crypt(p_password, gen_salt('bf')),
    p_full_name
  )
  RETURNING id, email, full_name, is_admin, created_at INTO v_user;

  v_token := encode(gen_random_bytes(32), 'hex');
  v_expires_at := NOW() + INTERVAL '30 days';

  INSERT INTO app_sessions (user_id, token, expires_at)
  VALUES (v_user.id, v_token, v_expires_at);

  RETURN json_build_object(
    'success', true,
    'user', row_to_json(v_user),
    'token', v_token
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to login user (Email/Pass)
CREATE OR REPLACE FUNCTION login_user(
  p_email TEXT,
  p_password TEXT
) RETURNS JSON AS $$
DECLARE
  v_user RECORD;
  v_token TEXT;
  v_expires_at TIMESTAMPTZ;
BEGIN
  SELECT id, email, full_name, is_admin, created_at, password_hash 
  INTO v_user
  FROM app_users 
  WHERE email = p_email;

  IF v_user IS NULL OR v_user.password_hash IS NULL THEN
    RETURN json_build_object('success', false, 'message', 'Invalid email or password');
  END IF;

  IF v_user.password_hash = crypt(p_password, v_user.password_hash) THEN
    v_token := encode(gen_random_bytes(32), 'hex');
    v_expires_at := NOW() + INTERVAL '30 days';

    INSERT INTO app_sessions (user_id, token, expires_at)
    VALUES (v_user.id, v_token, v_expires_at);

    RETURN json_build_object(
      'success', true,
      'user', json_build_object(
        'id', v_user.id,
        'email', v_user.email,
        'full_name', v_user.full_name,
        'is_admin', v_user.is_admin,
        'created_at', v_user.created_at
      ),
      'token', v_token
    );
  ELSE
    RETURN json_build_object('success', false, 'message', 'Invalid email or password');
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to request OTP
CREATE OR REPLACE FUNCTION request_otp(
  p_phone TEXT
) RETURNS JSON AS $$
DECLARE
  v_code TEXT;
BEGIN
  -- Generate 6 digit code
  v_code := floor(100000 + random() * 900000)::text;
  
  INSERT INTO otp_codes (phone, code, expires_at)
  VALUES (p_phone, v_code, NOW() + INTERVAL '10 minutes');

  -- Return code for dev purposes
  RETURN json_build_object(
    'success', true,
    'message', 'OTP sent',
    'code', v_code 
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to verify OTP and Login/Register
CREATE OR REPLACE FUNCTION verify_otp(
  p_phone TEXT,
  p_code TEXT
) RETURNS JSON AS $$
DECLARE
  v_otp RECORD;
  v_user RECORD;
  v_token TEXT;
  v_expires_at TIMESTAMPTZ;
  v_user_id UUID;
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

  -- Find or Create User
  SELECT * INTO v_user FROM app_users WHERE phone = p_phone;

  IF v_user IS NULL THEN
    INSERT INTO app_users (phone) VALUES (p_phone)
    RETURNING * INTO v_user;
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

-- Function for Apple Login
CREATE OR REPLACE FUNCTION login_apple(
  p_apple_id TEXT,
  p_email TEXT DEFAULT NULL,
  p_full_name TEXT DEFAULT NULL
) RETURNS JSON AS $$
DECLARE
  v_user RECORD;
  v_token TEXT;
  v_expires_at TIMESTAMPTZ;
BEGIN
  -- Find User by Apple ID
  SELECT * INTO v_user FROM app_users WHERE apple_id = p_apple_id;

  IF v_user IS NULL THEN
    -- Try finding by email if provided to link accounts (optional security risk if email not verified, but standard for this level)
    IF p_email IS NOT NULL THEN
      SELECT * INTO v_user FROM app_users WHERE email = p_email;
    END IF;

    IF v_user IS NOT NULL THEN
      -- Link Apple ID to existing user
      UPDATE app_users SET apple_id = p_apple_id WHERE id = v_user.id
      RETURNING * INTO v_user;
    ELSE
      -- Create new user
      INSERT INTO app_users (apple_id, email, full_name)
      VALUES (p_apple_id, p_email, p_full_name)
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

-- Function to get user by token (Updated)
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

  SELECT id, email, phone, full_name, is_admin, created_at 
  INTO v_user 
  FROM app_users 
  WHERE id = v_session.user_id;

  RETURN json_build_object(
    'success', true,
    'user', row_to_json(v_user)
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to logout
CREATE OR REPLACE FUNCTION logout_user(
  p_token TEXT
) RETURNS JSON AS $$
BEGIN
  DELETE FROM app_sessions WHERE token = p_token;
  RETURN json_build_object('success', true);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
