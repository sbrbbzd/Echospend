-- Add prediction_source column to expenses table
ALTER TABLE public.expenses
ADD COLUMN prediction_source TEXT DEFAULT 'manual';

COMMENT ON COLUMN public.expenses.prediction_source IS 'Source of the category prediction: manual, gemini, or local-cache';
