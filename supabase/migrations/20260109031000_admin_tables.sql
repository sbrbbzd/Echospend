-- Migration: support admin tables for languages and currencies
-- Date: 2026-01-09

-- 1. Create supported_languages table
CREATE TABLE IF NOT EXISTS supported_languages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT NOT NULL UNIQUE, -- e.g. 'en', 'es'
  name TEXT NOT NULL, -- e.g. 'English', 'Español'
  icon TEXT, -- text representation of flag or icon e.g. '🇺🇸'
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Create supported_currencies table
CREATE TABLE IF NOT EXISTS supported_currencies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT NOT NULL UNIQUE, -- e.g. 'USD', 'EUR'
  name TEXT NOT NULL, -- e.g. 'US Dollar'
  symbol TEXT NOT NULL, -- e.g. '$'
  icon TEXT, -- e.g. '🇺🇸'
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Seed Languages
INSERT INTO supported_languages (code, name, icon) VALUES
('en', 'English', '🇺🇸'),
('es', 'Spanish', '🇪🇸'),
('fr', 'French', '🇫🇷'),
('az', 'Azerbaijani', '🇦🇿')
ON CONFLICT (code) DO NOTHING;

-- 4. Seed Currencies
INSERT INTO supported_currencies (code, name, symbol, icon) VALUES
('USD', 'US Dollar', '$', '🇺🇸'),
('EUR', 'Euro', '€', '🇪🇺'),
('GBP', 'British Pound', '£', '🇬🇧'),
('JPY', 'Japanese Yen', '¥', '🇯🇵'),
('AZN', 'Azerbaijani Manat', '₼', '🇦🇿')
ON CONFLICT (code) DO NOTHING;
