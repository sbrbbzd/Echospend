-- Fix Chat Foreign Key and RLS for Custom Auth
-- We are using a custom 'app_users' table, not Supabase 'auth.users'.
-- And we are using opaque tokens, not JWTs, so standard RLS won't work.

-- 1. Drop the FK constraint to auth.users
ALTER TABLE chat_messages DROP CONSTRAINT IF EXISTS chat_messages_user_id_fkey;

-- 2. Update RLS policies to allow access (Authentication is handled by app logic/token filtering)
DROP POLICY IF EXISTS "Users can see their own messages" ON chat_messages;
DROP POLICY IF EXISTS "Users can insert their own messages" ON chat_messages;
DROP POLICY IF EXISTS "Users can update their own messages" ON chat_messages;

-- Enable permissive access (like the expenses table)
CREATE POLICY "Allow all operations on chat_messages" ON chat_messages
  FOR ALL USING (true) WITH CHECK (true);
