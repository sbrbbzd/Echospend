#!/bin/bash

# Supabase Migration Runner
# This script helps you run migrations in your Supabase project

echo "🚀 Supabase Migration Runner"
echo "=============================="
echo ""

# Check if Supabase CLI is installed
if command -v supabase &> /dev/null; then
    echo "✅ Supabase CLI found"
    echo ""
    echo "To run migrations with Supabase CLI:"
    echo "  1. Link your project: supabase link --project-ref YOUR_PROJECT_REF"
    echo "  2. Push migrations: supabase db push"
    echo ""
else
    echo "⚠️  Supabase CLI not found"
    echo ""
    echo "To install Supabase CLI:"
    echo "  macOS: brew install supabase/tap/supabase"
    echo "  Or use: npx supabase"
    echo ""
fi

echo "📋 Manual Migration Instructions:"
echo "=============================="
echo ""
echo "1. Go to your Supabase Dashboard: https://supabase.com/dashboard"
echo "2. Select your project"
echo "3. Navigate to SQL Editor"
echo "4. Copy and paste the contents of:"
echo "   - supabase/migrations/20240103000000_initial_schema.sql"
echo "5. Click 'Run' to execute"
echo ""
echo "📁 Available migrations:"
ls -1 supabase/migrations/*.sql 2>/dev/null || echo "   No migration files found"
echo ""

