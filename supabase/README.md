# Supabase Migrations

This directory contains database migrations for the EchoSpend application.

## Migration Files

- `migrations/20240103000000_initial_schema.sql` - Initial database schema setup

## Running Migrations

### Option 1: Using Supabase Dashboard (Recommended for Quick Setup)

1. Go to your Supabase project dashboard: https://supabase.com/dashboard
2. Navigate to **SQL Editor**
3. Copy and paste the contents of `migrations/20240103000000_initial_schema.sql`
4. Click **Run** to execute the migration

### Option 2: Using Supabase CLI

1. Install Supabase CLI:
   ```bash
   # macOS
   brew install supabase/tap/supabase
   
   # Or using npm (local to project)
   npx supabase
   ```

2. Link your project:
   ```bash
   supabase link --project-ref your-project-ref
   ```

3. Run migrations:
   ```bash
   supabase db push
   ```

### Option 3: Using the Legacy Migration File

The `migrations.sql` file in the root of the `supabase/` directory can be run directly in the Supabase SQL Editor for a one-time setup.

## Migration Structure

Each migration file follows the naming convention: `YYYYMMDDHHMMSS_description.sql`

This ensures migrations run in chronological order.

## What's Included

- **expenses** table: Stores expense records with amount, category, description, date, time, and income flag
- **settings** table: Stores application settings like monthly budget
- **Indexes**: Optimized indexes on frequently queried columns
- **Triggers**: Automatic `updated_at` timestamp updates
- **RLS Policies**: Row Level Security policies (currently open, can be restricted later)

## Next Steps

After running the initial migration, you can:
1. Add authentication and restrict RLS policies
2. Add user-specific data isolation
3. Create additional migrations as your schema evolves

