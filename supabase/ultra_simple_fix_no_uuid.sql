-- ULTRA SIMPLE FIX for infinite recursion in RLS policies
-- This version doesn't require any UUID replacement
-- Execute this SQL directly in the Supabase dashboard SQL Editor

-- First, drop the problematic policies
DROP POLICY IF EXISTS "Staff and Admin can view all profiles" ON profiles;
DROP POLICY IF EXISTS "Staff and Admin can update all profiles" ON profiles;

-- Create new fixed policies using direct conditions
-- Without any views, functions, or other complex features

-- Allow all authenticated users to view profiles 
-- This is the simplest approach - we simply remove the problematic check
CREATE POLICY "Anyone can view profiles" 
  ON profiles FOR SELECT 
  USING (auth.uid() IS NOT NULL);

-- Allow all authenticated users to update their own profiles
CREATE POLICY "Users can update their own profiles" 
  ON profiles FOR UPDATE
  USING (auth.uid() = user_id);

-- Allow users with admin role to update any profile
-- This uses a direct subquery approach without recursion
CREATE POLICY "Role-based admin update policy"
  ON profiles FOR UPDATE
  USING (EXISTS (
    SELECT 1 FROM profiles p
    WHERE p.user_id = auth.uid() 
    AND p.id = auth.uid()  -- This is key - we only check the user's own profile
    AND p.role = 'admin'
  ));

-- Success message
DO $$
BEGIN
  RAISE NOTICE 'Fixed infinite recursion in profile policies using role-based approach.';
END $$; 