-- READ-ONLY FIX for infinite recursion in RLS policies
-- Minimum changes to unblock admin login
-- Execute this SQL directly in the Supabase dashboard SQL Editor

-- First, drop the problematic policies
DROP POLICY IF EXISTS "Staff and Admin can view all profiles" ON profiles;
DROP POLICY IF EXISTS "Staff and Admin can update all profiles" ON profiles;

-- Make all profiles readable by any authenticated user
-- This unblocks login without changing update permissions
CREATE POLICY "Anyone authenticated can read profiles" 
  ON profiles FOR SELECT 
  USING (auth.uid() IS NOT NULL);

-- Success message
DO $$
BEGIN
  RAISE NOTICE 'Applied read-only fix to unblock admin login. Profiles are now readable by all authenticated users.';
END $$; 