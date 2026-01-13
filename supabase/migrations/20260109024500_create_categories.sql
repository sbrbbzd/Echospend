-- Migration: Create Categories Table
-- Date: 2026-01-09

CREATE TABLE IF NOT EXISTS categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  name TEXT NOT NULL,
  icon TEXT NOT NULL, -- identifier string for lucide icon
  color TEXT NOT NULL, -- hex color code
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Prevent duplicate category names for the same user
  CONSTRAINT unique_user_category_name UNIQUE (user_id, name)
);

-- Index for performance
CREATE INDEX IF NOT EXISTS idx_categories_user_id ON categories(user_id);

-- Enable RLS (Optional but recommended if sticking to that pattern)
-- ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
