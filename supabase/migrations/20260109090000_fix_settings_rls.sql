-- Fix settings table RLS to handle user_id queries
-- Date: 2026-01-09

-- Drop existing policy
DROP POLICY IF EXISTS "Allow all operations on settings" ON settings;

-- Create new policy that works with user_id filtering
CREATE POLICY "Allow all operations on settings" ON settings
  FOR ALL USING (true) WITH CHECK (true);

-- Ensure settings table has proper structure
-- The table should allow queries with user_id filter
ALTER TABLE settings ALTER COLUMN user_id DROP NOT NULL;
