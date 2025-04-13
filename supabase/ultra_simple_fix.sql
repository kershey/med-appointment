-- ULTRA SIMPLE FIX for infinite recursion in RLS policies
-- This version uses the absolute minimum SQL features needed to fix the issue
-- Execute this SQL directly in the Supabase dashboard SQL Editor

-- First, drop the problematic policies
DROP POLICY IF EXISTS "Staff and Admin can view all profiles" ON profiles;
DROP POLICY IF EXISTS "Staff and Admin can update all profiles" ON profiles;

-- Create new fixed policies using direct conditions
-- Without any views, functions, or other complex features

-- Option 1: Allow all authenticated users to view profiles 
-- This is the simplest approach - we simply remove the problematic check
CREATE POLICY "Anyone can view profiles" 
  ON profiles FOR SELECT 
  USING (auth.uid() IS NOT NULL);

-- Option 2: Allow all authenticated users to update their own profiles
-- But only allow admins/staff to update other profiles
CREATE POLICY "Users can update their own profiles" 
  ON profiles FOR UPDATE
  USING (auth.uid() = user_id);

-- (Optional) If you still need admin/staff to update any profile,
-- you'll need this second policy, but it's simpler than the old one
CREATE POLICY "Admins from specific IDs can update any profile"
  ON profiles FOR UPDATE
  USING (auth.uid() IN (
    -- Replace these UUIDs with actual admin user IDs from your system
    -- You can get these from the Supabase dashboard > Authentication > Users
    'your-admin-user-id-here'
    -- Add more IDs separated by commas if needed
    -- 'another-admin-id', 'yet-another-admin-id'
  )); 