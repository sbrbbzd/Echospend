-- Migration: Cleanup Nulls and Fix Settings PK
-- Date: 2026-01-09
-- Purpose: Fix "column user_id contains null values" error by cleaning data

-- 1. Delete orphaned settings that have no user (since we are moving to user-isolated data)
DELETE FROM settings WHERE user_id IS NULL;

-- 2. Make user_id NOT NULL (Required for Primary Key)
ALTER TABLE settings ALTER COLUMN user_id SET NOT NULL;

-- 3. Now we can safely add the Primary Key
-- Drop existing constraints just in case
ALTER TABLE settings DROP CONSTRAINT IF EXISTS settings_pkey;
ALTER TABLE settings ADD PRIMARY KEY (user_id, key);

-- 4. Verify indexes
CREATE INDEX IF NOT EXISTS idx_settings_user_id ON settings(user_id);
