# Fixing Profile Fetch Infinite Recursion Error

## Problem Description

You're encountering this error when trying to fetch a user profile:

```
Profile fetch error: "{\n \"code\": \"42P17\",\n \"details\": null,\n \"hint\": null,\n \"message\": \"infinite recursion detected in policy for relation \\\"profiles\\\"\"\n}"
```

This happens because of a circular reference in the Row Level Security (RLS) policies for the `profiles` table. The policies checking for admin/staff privileges are themselves trying to access the `profiles` table, creating an infinite loop.

## The Solution

The fix creates a separate materialized view called `admin_staff_roles` that stores user roles without going through RLS policies. This breaks the circular reference and allows the admin login to work properly.

## How to Apply the Fix

### Option 1: Using the Supabase Dashboard (Recommended)

1. Log in to your Supabase dashboard
2. Navigate to the SQL Editor
3. Copy the contents of the `fix-profile-policies.sql` file
4. Paste it into the SQL Editor
5. Run the SQL
6. You should see a success message

### Option 2: Using the Script (Advanced)

If you prefer to run the fix programmatically:

1. Make sure you have Node.js installed
2. Ensure your `.env` file has the Supabase URL and service role key:
   ```
   NEXT_PUBLIC_SUPABASE_URL=your-supabase-url
   SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
   ```
3. Run the fix script:
   ```
   npm run fix:profiles
   ```

## Verification

After applying the fix:

1. Restart your Next.js application
2. Try logging in again as an admin
3. The error should be resolved and you should now be able to log in successfully

## Technical Details

The fix works by:

1. Dropping the recursive policies
2. Creating a materialized view that contains admin/staff roles
3. Creating new policies that reference this view instead of the profiles table directly
4. Setting up a trigger to keep the view updated when profiles change

This breaks the circular dependency while maintaining the same access control logic.
