-- DIRECT ROLE CHECK FIX for infinite recursion in RLS policies
-- Uses a direct approach without complex features
-- Execute this SQL directly in the Supabase dashboard SQL Editor

-- First, drop the problematic policies
DROP POLICY IF EXISTS "Staff and Admin can view all profiles" ON profiles;
DROP POLICY IF EXISTS "Staff and Admin can update all profiles" ON profiles;

-- Temporary disable RLS to create our helper table
ALTER TABLE profiles DISABLE ROW LEVEL SECURITY;

-- Create a simple table (not a view) to store admin/staff users
-- This avoids any recursive policy checks
DROP TABLE IF EXISTS admin_staff_users;
CREATE TABLE admin_staff_users (
  user_id UUID PRIMARY KEY
);

-- Populate the table with current admin/staff users
INSERT INTO admin_staff_users (user_id)
SELECT DISTINCT user_id 
FROM profiles 
WHERE role IN ('admin', 'staff')
ON CONFLICT (user_id) DO NOTHING;

-- Re-enable RLS
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Create a policy to let this table be updated by service_role
ALTER TABLE admin_staff_users ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Service role can manage admin users" ON admin_staff_users;
CREATE POLICY "Service role can manage admin users" 
  ON admin_staff_users 
  FOR ALL 
  TO service_role 
  USING (true);

-- Create a trigger function to keep admin_staff_users in sync
-- when profiles are updated
CREATE OR REPLACE FUNCTION sync_admin_staff_users()
RETURNS TRIGGER AS $$
BEGIN
  -- Handle INSERT and UPDATE operations
  IF (TG_OP = 'INSERT' OR TG_OP = 'UPDATE') THEN
    -- If the user is an admin or staff, add to admin_staff_users
    IF NEW.role IN ('admin', 'staff') THEN
      INSERT INTO admin_staff_users (user_id) 
      VALUES (NEW.user_id)
      ON CONFLICT (user_id) DO NOTHING;
    ELSE
      -- If the user is no longer an admin or staff, remove from admin_staff_users
      DELETE FROM admin_staff_users WHERE user_id = NEW.user_id;
    END IF;
  END IF;
  
  -- Handle DELETE operations
  IF (TG_OP = 'DELETE') THEN
    DELETE FROM admin_staff_users WHERE user_id = OLD.user_id;
  END IF;
  
  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create the trigger on profiles
DROP TRIGGER IF EXISTS trigger_sync_admin_staff_users ON profiles;
CREATE TRIGGER trigger_sync_admin_staff_users
AFTER INSERT OR UPDATE OR DELETE ON profiles
FOR EACH ROW EXECUTE FUNCTION sync_admin_staff_users();

-- Create new policies that use the helper table
CREATE POLICY "Staff and Admin can view all profiles"
  ON profiles FOR SELECT
  USING (
    auth.uid() IN (SELECT user_id FROM admin_staff_users)
    OR
    auth.uid() = user_id
  );

CREATE POLICY "Staff and Admin can update all profiles"
  ON profiles FOR UPDATE
  USING (
    auth.uid() IN (SELECT user_id FROM admin_staff_users)
    OR
    auth.uid() = user_id
  );

-- Success message
DO $$
BEGIN
  RAISE NOTICE 'Fixed infinite recursion in profile policies using direct table approach.';
END $$; 