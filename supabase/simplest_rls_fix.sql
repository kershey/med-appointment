-- SIMPLEST POSSIBLE FIX for infinite recursion in RLS policies
-- No UUIDs, no subqueries, no complexity
-- Execute this SQL directly in the Supabase dashboard SQL Editor

-- First, drop the problematic policies
DROP POLICY IF EXISTS "Staff and Admin can view all profiles" ON profiles;
DROP POLICY IF EXISTS "Staff and Admin can update all profiles" ON profiles;

-- Now create two simple policies that should work without recursion:

-- 1. Everyone can see their own profile
CREATE POLICY "Users can view their own profiles" 
  ON profiles FOR SELECT 
  USING (auth.uid() = user_id);

-- 2. Everyone can update their own profile
CREATE POLICY "Users can update their own profiles" 
  ON profiles FOR UPDATE
  USING (auth.uid() = user_id);

-- 3. Allow the service_role to do everything (this is used for admin operations)
CREATE POLICY "Service role can do everything" 
  ON profiles FOR ALL 
  TO service_role 
  USING (true);

-- Success message
DO $$
BEGIN
  RAISE NOTICE 'Applied simplest RLS fix. Login with service_role for admin operations.';
END $$; 