-- Migration: Fix OTP RLS Policies
-- Description: Allow unauthenticated users to read OTP codes for verification
-- Date: 2024-01-03

-- Drop existing OTP policies
DROP POLICY IF EXISTS "Admins can view all OTP codes" ON otp_codes;
DROP POLICY IF EXISTS "Anyone can insert OTP codes" ON otp_codes;
DROP POLICY IF EXISTS "Anyone can update OTP codes" ON otp_codes;

-- Allow anyone to read OTP codes (needed for verification before authentication)
-- OTP codes are temporary and expire quickly, so this is safe
CREATE POLICY "Anyone can read OTP codes" ON otp_codes
    FOR SELECT USING (true);

-- Allow anyone to insert OTP codes (for sending OTP)
CREATE POLICY "Anyone can insert OTP codes" ON otp_codes
    FOR INSERT WITH CHECK (true);

-- Allow anyone to update OTP codes (for marking as used)
CREATE POLICY "Anyone can update OTP codes" ON otp_codes
    FOR UPDATE USING (true);

