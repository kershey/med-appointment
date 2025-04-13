-- Fix infinite recursion in RLS policies for profiles table
-- This migration:
-- 1. Drops the recursive policies that are causing infinite recursion
-- 2. Creates a helper view to determine admin/staff roles without recursion
-- 3. Recreates the policies using the helper view

-- First, drop the problematic policies
DROP POLICY IF EXISTS "Staff and Admin can view all profiles" ON profiles;
DROP POLICY IF EXISTS "Staff and Admin can update all profiles" ON profiles;

-- Create a special non-RLS view to check for admin/staff roles
-- This view bypasses RLS for the specific purpose of role checking
DROP VIEW IF EXISTS auth_user_roles;
CREATE OR REPLACE VIEW auth_user_roles AS 
SELECT DISTINCT
  user_id,
  role
FROM profiles
WHERE role IN ('admin', 'staff');

-- Add necessary indexes to the view's underlying query
CREATE INDEX IF NOT EXISTS idx_profiles_user_id_role ON profiles(user_id, role);

-- Create new policies that use the non-recursive view
CREATE POLICY "Staff and Admin can view all profiles"
  ON profiles FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM auth_user_roles
      WHERE user_id = auth.uid() AND (role = 'staff' OR role = 'admin')
    )
  );

CREATE POLICY "Staff and Admin can update all profiles"
  ON profiles FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM auth_user_roles
      WHERE user_id = auth.uid() AND (role = 'staff' OR role = 'admin')
    )
  );

-- Grant appropriate permissions to the view
GRANT SELECT ON auth_user_roles TO authenticated, service_role, anon;

-- Log that this migration was applied
DO $$
BEGIN
  RAISE NOTICE 'Migration applied: Fixed infinite recursion in profile policies';
END $$; 