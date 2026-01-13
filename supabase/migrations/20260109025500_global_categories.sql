-- Migration: support global categories
-- Date: 2026-01-09

-- 1. Make user_id nullable to support global categories
ALTER TABLE categories ALTER COLUMN user_id DROP NOT NULL;

-- 2. Create unique index for global categories to prevent duplicates
CREATE UNIQUE INDEX IF NOT EXISTS idx_categories_global_name ON categories(name) WHERE user_id IS NULL;

-- 3. Insert Global Defaults (user_id = NULL)
INSERT INTO categories (name, icon, color, user_id)
VALUES
  ('Food', 'Utensils', '#f97316', NULL),
  ('Transport', 'Car', '#3b82f6', NULL),
  ('Utilities', 'Zap', '#eab308', NULL),
  ('Entertainment', 'Film', '#a855f7', NULL),
  ('Groceries', 'ShoppingBasket', '#10b981', NULL),
  ('Shopping', 'ShoppingBag', '#ec4899', NULL),
  ('Health', 'Activity', '#ef4444', NULL),
  ('Travel', 'Plane', '#06b6d4', NULL),
  ('Other', 'HelpCircle', '#64748b', NULL)
ON CONFLICT DO NOTHING; -- Safe to run multiple times because of the unique index above (or if names clash)

-- Note: The previous UNIQUE constraint (user_id, name) might interfere if user_id is null.
-- Standard Postgres: (NULL, 'Food') != (NULL, 'Food') for unique constraints, so multiples allowed without the specific index above.
-- But we want to enforce only ONE global 'Food'. The index in step 2 handles this.
