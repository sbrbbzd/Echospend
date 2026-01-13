# Authentication & Admin Panel Setup Guide

## Overview

This application now includes:
- Phone number authentication with OTP
- Apple ID sign-in
- Admin panel with Ant Design
- Protected routes

## Database Setup

### Step 1: Run Migrations

1. Go to your Supabase Dashboard: https://supabase.com/dashboard
2. Navigate to **SQL Editor**
3. Run the following migrations in order:

   - `supabase/migrations/20240103000000_initial_schema.sql` (if not already run)
   - `supabase/migrations/20240103000001_auth_tables.sql` (NEW - for authentication)

### Step 2: Configure Supabase Auth

1. In Supabase Dashboard, go to **Authentication** > **Providers**
2. Enable **Phone** provider (for OTP authentication)
3. Enable **Apple** provider (for Apple Sign-In)
   - Configure Apple OAuth credentials
   - Set redirect URL: `https://your-domain.com/auth/callback`

## Creating Your First Admin User

After running the migrations, you need to manually create an admin user:

1. Sign up normally through the app (phone or Apple)
2. Go to Supabase Dashboard > **Table Editor** > `user_profiles`
3. Find your user record
4. Set `is_admin` to `true`

Alternatively, you can run this SQL in the SQL Editor:

```sql
-- Replace 'YOUR_USER_ID' with your actual user ID from auth.users table
UPDATE user_profiles 
SET is_admin = TRUE 
WHERE id = 'YOUR_USER_ID';
```

## Features

### Authentication

- **Phone + OTP**: Users enter phone number, receive 6-digit OTP code
- **Apple ID**: OAuth sign-in with Apple
- **Session Management**: Automatic session handling with Supabase Auth

### Admin Panel (`/admin`)

The admin panel includes:

1. **OTP Codes Table**
   - View all OTP codes sent
   - See phone numbers, codes, status (Active/Used/Expired)
   - Search by phone number
   - Delete OTP codes
   - View creation and expiration times

2. **User Profiles Table**
   - View all registered users
   - See phone numbers, Apple IDs, names
   - Make users admin or remove admin status
   - View creation dates

### Protected Routes

- `/login` - Login page (public)
- `/signup` - Signup page (public)
- `/admin` - Admin panel (admin only)
- All other routes require authentication

## Development Notes

### OTP Codes in Development

In development mode, OTP codes are displayed in:
1. Browser console
2. Alert popup (for testing)
3. Admin panel

**Important**: In production, remove the OTP code from the response and implement actual SMS sending (Twilio, etc.)

### Apple Sign-In Setup

For Apple Sign-In to work in production:
1. Create an App ID in Apple Developer Portal
2. Configure Service ID
3. Add redirect URLs
4. Update Supabase Apple provider settings

## File Structure

```
app/
  ├── login.tsx          # Login page
  ├── signup.tsx         # Signup page
  ├── admin.tsx          # Admin panel (Ant Design)
  └── _layout.tsx        # Root layout with auth protection

services/
  ├── authService.ts    # Authentication functions
  └── adminService.ts   # Admin panel functions

contexts/
  └── AuthContext.tsx   # Authentication context provider

supabase/migrations/
  ├── 20240103000000_initial_schema.sql
  └── 20240103000001_auth_tables.sql
```

## Usage

### For Users

1. Navigate to `/login` or `/signup`
2. Choose authentication method:
   - Enter phone number → receive OTP → verify
   - Click "Continue with Apple"
3. After authentication, access the main app

### For Admins

1. Sign in with an admin account
2. Navigate to `/admin`
3. View and manage:
   - OTP codes
   - User profiles
   - Admin permissions

## Security Notes

- RLS (Row Level Security) is enabled on all tables
- Admin-only access is enforced at both database and application level
- OTP codes expire after 10 minutes
- Used OTP codes cannot be reused

## Next Steps

1. Run the database migrations
2. Create your first admin user
3. Test authentication flow
4. Configure SMS service for production OTP delivery
5. Set up Apple OAuth credentials for production

