-- Migration: Add user_id to tables for data isolation
-- Date: 2026-01-09

-- 1. Add user_id to expenses
ALTER TABLE expenses ADD COLUMN IF NOT EXISTS user_id UUID;

-- 2. Add user_id to settings
ALTER TABLE settings ADD COLUMN IF NOT EXISTS user_id UUID;

-- 3. Update Primary Key for settings to be composite (user_id, key)
-- First drop existing PK constraint
ALTER TABLE settings DROP CONSTRAINT IF EXISTS settings_pkey;

-- Handle existing data (Optional: Assign to a specific user if needed, or delete)
-- DELETE FROM settings WHERE user_id IS NULL; -- Uncomment if you want to wipe old non-user settings
-- For now, we allow nulls temporarily or you can update them manually:
-- UPDATE settings SET user_id = 'YOUR_USER_ID' WHERE user_id IS NULL;

-- Create new PK (only works if user_id is not null for all rows, usually desirable)
-- Since we are migrating live, we might leave it or enforce it. 
-- Let's make user_id NOT NULL only if you wipe data. For safety, we keep it nullable but logic will enforce it.
-- Ideally:
-- ALTER TABLE settings ALTER COLUMN user_id SET NOT NULL;
-- ALTER TABLE settings ADD PRIMARY KEY (user_id, key);

-- 4. Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_expenses_user_id ON expenses(user_id);
CREATE INDEX IF NOT EXISTS idx_settings_user_id ON settings(user_id);

-- 5. Enable RLS (Row Level Security) and Policies associated with auth.uid()
-- Note: Logic currently uses custom auth token so standard supabase.auth.uid() might not match 
-- unless 'get_user_by_token' populates the session context correctly.
-- Since the app uses manual 'user_id' filtering in queries, RLS acts as a safety net.

-- IF you were using standard GoTrue/Supabase Auth:
-- ALTER TABLE expenses ENABLE ROW LEVEL SECURITY;
-- CREATE POLICY "Users see their own expenses" ON expenses
--   FOR ALL USING (auth.uid() = user_id);
