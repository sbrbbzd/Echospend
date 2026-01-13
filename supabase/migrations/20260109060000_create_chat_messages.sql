-- Create chat_messages table
create table if not exists chat_messages (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) not null,
  text text not null,
  sender text not null check (sender in ('user', 'bot')),
  data jsonb,
  created_at timestamptz default now(),
  is_deleted boolean default false
);

-- Enable RLS
alter table chat_messages enable row level security;

-- Policy: Users can see their own non-deleted messages
create policy "Users can see their own messages"
on chat_messages for select
using (auth.uid() = user_id and is_deleted = false);

-- Policy: Users can insert their own messages
create policy "Users can insert their own messages"
on chat_messages for insert
with check (auth.uid() = user_id);

-- Policy: Users can update their own messages (for soft delete)
create policy "Users can update their own messages"
on chat_messages for update
using (auth.uid() = user_id);
