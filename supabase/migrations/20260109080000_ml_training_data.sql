-- ML Training Data Schema
-- Description: Tables for collecting training data, admin corrections, model versions, and A/B testing
-- Date: 2026-01-09

-- Raw input data from users for training
CREATE TABLE IF NOT EXISTS ml_training_samples (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES app_users(id),
  input_text TEXT NOT NULL, -- "coffee", "lunch at chipotle", "uber ride"
  input_type TEXT CHECK (input_type IN ('voice', 'text', 'manual')),
  parsed_category TEXT, -- What the model predicted
  model_version TEXT,
  confidence_score DECIMAL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  is_anonymized BOOLEAN DEFAULT FALSE
);

-- Admin corrections and labels
CREATE TABLE IF NOT EXISTS ml_corrections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sample_id UUID REFERENCES ml_training_samples(id) ON DELETE CASCADE,
  admin_id UUID REFERENCES app_users(id),
  correct_category TEXT NOT NULL, -- The actual correct category
  correction_notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Model performance tracking
CREATE TABLE IF NOT EXISTS ml_model_versions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  version_name TEXT UNIQUE NOT NULL,
  base_model TEXT, -- e.g., 'gemini-2.5-flash'
  training_samples_count INT,
  accuracy_score DECIMAL,
  deployed_at TIMESTAMPTZ,
  is_active BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- A/B testing results
CREATE TABLE IF NOT EXISTS ml_ab_tests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  model_a_version TEXT,
  model_b_version TEXT,
  sample_id UUID REFERENCES ml_training_samples(id),
  selected_model TEXT,
  user_feedback TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- User ML preferences
CREATE TABLE IF NOT EXISTS ml_user_preferences (
  user_id UUID PRIMARY KEY REFERENCES app_users(id),
  data_collection_consent BOOLEAN DEFAULT TRUE, -- Changed to TRUE - opt-out instead of opt-in
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_ml_samples_user_id ON ml_training_samples(user_id);
CREATE INDEX IF NOT EXISTS idx_ml_samples_confidence ON ml_training_samples(confidence_score);
CREATE INDEX IF NOT EXISTS idx_ml_samples_created ON ml_training_samples(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_ml_corrections_sample ON ml_corrections(sample_id);
CREATE INDEX IF NOT EXISTS idx_ml_model_active ON ml_model_versions(is_active);

-- Enable RLS (Row Level Security)
ALTER TABLE ml_training_samples ENABLE ROW LEVEL SECURITY;
ALTER TABLE ml_corrections ENABLE ROW LEVEL SECURITY;
ALTER TABLE ml_model_versions ENABLE ROW LEVEL SECURITY;
ALTER TABLE ml_ab_tests ENABLE ROW LEVEL SECURITY;
ALTER TABLE ml_user_preferences ENABLE ROW LEVEL SECURITY;

-- RLS Policies (Allow all for now, matching app_users pattern)
CREATE POLICY "Allow all operations on ml_training_samples" ON ml_training_samples
  FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "Allow all operations on ml_corrections" ON ml_corrections
  FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "Allow all operations on ml_model_versions" ON ml_model_versions
  FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "Allow all operations on ml_ab_tests" ON ml_ab_tests
  FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "Allow all operations on ml_user_preferences" ON ml_user_preferences
  FOR ALL USING (true) WITH CHECK (true);
