-- Fix infinite recursion in RLS policies for profiles table
-- ALTERNATIVE VERSION compatible with older PostgreSQL
-- Execute this SQL directly in the Supabase dashboard SQL Editor

-- First, drop the problematic policies
DROP POLICY IF EXISTS "Staff and Admin can view all profiles" ON profiles;
DROP POLICY IF EXISTS "Staff and Admin can update all profiles" ON profiles;

-- Simpler approach using a regular view instead of materialized view
-- This resolves the REFRESH syntax error

-- Create a special non-RLS view to check for admin/staff roles
DROP VIEW IF EXISTS admin_staff_view;
CREATE OR REPLACE VIEW admin_staff_view AS 
SELECT DISTINCT
  user_id,
  role
FROM profiles
WHERE role IN ('admin', 'staff');

-- Add necessary indexes to the view's underlying query for performance
CREATE INDEX IF NOT EXISTS idx_profiles_user_id_role ON profiles(user_id, role);

-- Create new policies that use the non-recursive view
CREATE POLICY "Staff and Admin can view all profiles"
  ON profiles FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM admin_staff_view
      WHERE user_id = auth.uid() AND (role = 'staff' OR role = 'admin')
    )
  );

CREATE POLICY "Staff and Admin can update all profiles"
  ON profiles FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM admin_staff_view
      WHERE user_id = auth.uid() AND (role = 'staff' OR role = 'admin')
    )
  );

-- Grant appropriate permissions to the view
GRANT SELECT ON admin_staff_view TO authenticated, service_role, anon;

-- Output success message
DO $$
BEGIN
    RAISE NOTICE 'Fixed infinite recursion in profile policies successfully using regular view.';
END $$; 