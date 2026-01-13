-- Add date_of_birth and avatar columns to app_users table
ALTER TABLE app_users ADD COLUMN IF NOT EXISTS date_of_birth TEXT;
ALTER TABLE app_users ADD COLUMN IF NOT EXISTS avatar TEXT DEFAULT 'default';

-- Update the update_user_profile function to include date_of_birth and avatar
CREATE OR REPLACE FUNCTION update_user_profile(
  p_user_id UUID,
  p_full_name TEXT DEFAULT NULL,
  p_currency TEXT DEFAULT NULL,
  p_language TEXT DEFAULT NULL,
  p_date_of_birth TEXT DEFAULT NULL,
  p_avatar TEXT DEFAULT NULL
) RETURNS JSON AS $$
DECLARE
  v_user RECORD;
BEGIN
  -- Verify user exists
  SELECT * INTO v_user FROM app_users WHERE id = p_user_id;
  
  IF v_user IS NULL THEN
    RETURN json_build_object('success', false, 'message', 'User not found');
  END IF;

  -- Update full_name if provided
  IF p_full_name IS NOT NULL AND p_full_name != '' THEN
    UPDATE app_users 
    SET full_name = p_full_name, updated_at = NOW()
    WHERE id = p_user_id;
  END IF;

  -- Update date_of_birth if provided
  IF p_date_of_birth IS NOT NULL AND p_date_of_birth != '' THEN
    UPDATE app_users 
    SET date_of_birth = p_date_of_birth, updated_at = NOW()
    WHERE id = p_user_id;
  END IF;

  -- Update avatar if provided
  IF p_avatar IS NOT NULL AND p_avatar != '' THEN
    UPDATE app_users 
    SET avatar = p_avatar, updated_at = NOW()
    WHERE id = p_user_id;
  END IF;

  -- Update currency setting if provided
  IF p_currency IS NOT NULL THEN
    INSERT INTO settings (user_id, key, value)
    VALUES (p_user_id, 'currency', p_currency)
    ON CONFLICT (user_id, key) 
    DO UPDATE SET value = EXCLUDED.value;
  END IF;

  -- Update language setting if provided
  IF p_language IS NOT NULL THEN
    INSERT INTO settings (user_id, key, value)
    VALUES (p_user_id, 'language', p_language)
    ON CONFLICT (user_id, key) 
    DO UPDATE SET value = EXCLUDED.value;
  END IF;

  -- Get updated user
  SELECT * INTO v_user FROM app_users WHERE id = p_user_id;

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
    )
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
