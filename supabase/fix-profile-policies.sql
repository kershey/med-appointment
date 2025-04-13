-- Fix infinite recursion in RLS policies for profiles table
-- Execute this SQL directly in the Supabase dashboard SQL Editor

-- First, drop the problematic policies
DROP POLICY IF EXISTS "Staff and Admin can view all profiles" ON profiles;
DROP POLICY IF EXISTS "Staff and Admin can update all profiles" ON profiles;

-- Create a temporary function to fix profile permissions
CREATE OR REPLACE FUNCTION fix_profile_policies()
RETURNS void AS $$
BEGIN
    -- Grant the service role user temporary permissions to bypass RLS
    ALTER TABLE profiles DISABLE ROW LEVEL SECURITY;
    
    -- Create a new materialized view for role checks
    DROP MATERIALIZED VIEW IF EXISTS admin_staff_roles;
    CREATE MATERIALIZED VIEW admin_staff_roles AS
    SELECT DISTINCT
      user_id,
      role
    FROM profiles
    WHERE role IN ('admin', 'staff');
    
    -- Add indexes to the materialized view
    CREATE INDEX IF NOT EXISTS idx_admin_staff_roles_user_id ON admin_staff_roles(user_id);
    
    -- Re-enable RLS
    ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
    
    -- Create new policies that use the materialized view
    CREATE POLICY "Staff and Admin can view all profiles"
      ON profiles FOR SELECT
      USING (
        EXISTS (
          SELECT 1 FROM admin_staff_roles
          WHERE user_id = auth.uid() AND (role = 'staff' OR role = 'admin')
        )
      );
    
    CREATE POLICY "Staff and Admin can update all profiles"
      ON profiles FOR UPDATE
      USING (
        EXISTS (
          SELECT 1 FROM admin_staff_roles
          WHERE user_id = auth.uid() AND (role = 'staff' OR role = 'admin')
        )
      );
    
    -- Grant appropriate permissions
    GRANT SELECT ON admin_staff_roles TO authenticated, service_role, anon;
    
    -- Create a function to refresh the materialized view
    CREATE OR REPLACE FUNCTION refresh_admin_staff_roles()
    RETURNS TRIGGER AS $$
    BEGIN
        REFRESH MATERIALIZED VIEW admin_staff_roles;
        RETURN NULL;
    END;
    $$ LANGUAGE plpgsql SECURITY DEFINER;
    
    -- Create a trigger to refresh the view when profiles change
    DROP TRIGGER IF EXISTS trigger_refresh_admin_staff_roles ON profiles;
    CREATE TRIGGER trigger_refresh_admin_staff_roles
    AFTER INSERT OR UPDATE OR DELETE
    ON profiles
    FOR EACH STATEMENT
    EXECUTE FUNCTION refresh_admin_staff_roles();
    
    -- Initial refresh of the materialized view
    REFRESH MATERIALIZED VIEW admin_staff_roles;
END;
$$ LANGUAGE plpgsql;

-- Execute the function
SELECT fix_profile_policies();

-- Drop the function when we're done
DROP FUNCTION fix_profile_policies();

-- Output success message
DO $$
BEGIN
    RAISE NOTICE 'Fixed infinite recursion in profile policies successfully.';
END $$; 