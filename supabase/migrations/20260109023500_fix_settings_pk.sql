-- Migration: Fix Settings Primary Key
-- Date: 2026-01-09
-- Purpose: properly enforce uniqueness on (user_id, key) so that UPSERT works correctly.

-- 1. Ensure user_id is NOT NULL for consistent PK (Optional, but recommended. If you have nulls, delete them or handle them)
-- DELETE FROM settings WHERE user_id IS NULL; 
-- ALTER TABLE settings ALTER COLUMN user_id SET NOT NULL;

-- 2. Add the Composite Primary Key
-- We use "IF NOT EXISTS" logic by dropping first just in case to avoid errors if partially applied
ALTER TABLE settings DROP CONSTRAINT IF EXISTS settings_pkey;
ALTER TABLE settings ADD PRIMARY KEY (user_id, key);

-- 3. Verify indexes
CREATE INDEX IF NOT EXISTS idx_settings_user_id ON settings(user_id);
