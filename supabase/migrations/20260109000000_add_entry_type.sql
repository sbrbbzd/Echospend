-- Add entry_type column to expenses table
ALTER TABLE expenses 
ADD COLUMN IF NOT EXISTS entry_type TEXT DEFAULT 'manual';

-- Comment on column
COMMENT ON COLUMN expenses.entry_type IS 'Type of entry: manual, voice, scan, etc.';
