-- Update existing ML user preferences to default consent to TRUE
-- Date: 2026-01-09

-- Update the default value for new rows
ALTER TABLE ml_user_preferences 
  ALTER COLUMN data_collection_consent SET DEFAULT TRUE;

-- Update existing rows that have FALSE to TRUE (opt everyone in)
UPDATE ml_user_preferences 
  SET data_collection_consent = TRUE 
  WHERE data_collection_consent = FALSE;
