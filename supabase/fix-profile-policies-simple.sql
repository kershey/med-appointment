-- SIMPLE FIX for infinite recursion in RLS policies
-- This version avoids all complex features and should work on any PostgreSQL version
-- Execute this SQL directly in the Supabase dashboard SQL Editor

-- Drop the problematic policies that cause infinite recursion
DROP POLICY IF EXISTS "Staff and Admin can view all profiles" ON profiles;
DROP POLICY IF EXISTS "Staff and Admin can update all profiles" ON profiles;

-- Create simpler, non-recursive policies that don't rely on views at all
-- Instead, use direct role checks within the security definer function

-- Create a function that safely checks if a user has admin or staff role
CREATE OR REPLACE FUNCTION is_admin_or_staff(check_user_id UUID) 
RETURNS BOOLEAN AS $$
DECLARE
  user_role TEXT;
BEGIN
  -- Get the role directly from profiles table
  -- This query bypasses RLS since the function is SECURITY DEFINER
  SELECT role INTO user_role 
  FROM profiles 
  WHERE user_id = check_user_id 
  LIMIT 1;
  
  -- Check if user has admin or staff role
  RETURN user_role IN ('admin', 'staff');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create new policies that use the checking function
CREATE POLICY "Staff and Admin can view all profiles"
  ON profiles FOR SELECT
  USING (is_admin_or_staff(auth.uid()));

CREATE POLICY "Staff and Admin can update all profiles"
  ON profiles FOR UPDATE
  USING (is_admin_or_staff(auth.uid()));

-- Add an index to improve performance
CREATE INDEX IF NOT EXISTS idx_profiles_user_id_role ON profiles(user_id, role);

-- Output success message
DO $$
BEGIN
  RAISE NOTICE 'Fixed infinite recursion in profile policies using simple function-based approach.';
END $$; 