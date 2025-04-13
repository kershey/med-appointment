-- EMERGENCY FIX - Temporary disable RLS
-- WARNING: This disables row level security temporarily
-- Use this only as a last resort to unblock admin login

-- Drop the problematic policies
DROP POLICY IF EXISTS "Staff and Admin can view all profiles" ON profiles;
DROP POLICY IF EXISTS "Staff and Admin can update all profiles" ON profiles;

-- Option 1: Add a policy that allows everyone to do everything (least secure)
CREATE POLICY "Allow all operations temporarily" 
  ON profiles 
  FOR ALL 
  USING (true);

-- Option 2: Or simply disable RLS on profiles table (ONLY USE TEMPORARILY!)
-- Uncomment the next line ONLY in extreme cases
-- ALTER TABLE profiles DISABLE ROW LEVEL SECURITY;

-- IMPORTANT: After fixing the login issue, be sure to:
-- 1. Drop this policy
-- 2. Re-enable RLS
-- 3. Create proper policies

-- Create a reminder that this is temporary
DO $$
BEGIN
  RAISE WARNING 'EMERGENCY FIX APPLIED - SECURITY IS REDUCED - REMEMBER TO RESTORE PROPER POLICIES ASAP';
END $$; 