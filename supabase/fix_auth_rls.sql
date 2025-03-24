-- First, enable RLS on profiles table
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Drop all existing policies on profiles table to avoid conflicts
DO $$ 
BEGIN
  EXECUTE (
    SELECT string_agg('DROP POLICY IF EXISTS "' || policyname || '" ON profiles;', E'\n')
    FROM pg_policies
    WHERE tablename = 'profiles'
  );
END $$;

-- Create essential policies for the profiles table
-- Allow users to view their own profile
CREATE POLICY "Users can view their own profile" 
ON profiles FOR SELECT 
USING (auth.uid() = id);

-- Allow users to update their own profile
CREATE POLICY "Users can update their own profile" 
ON profiles FOR UPDATE 
USING (auth.uid() = id);

-- Critical: Allow users to insert their own profile
CREATE POLICY "Users can insert their own profile" 
ON profiles FOR INSERT 
WITH CHECK (auth.uid() = id);

-- Allow service role to manage all profiles (for triggers/server functions)
CREATE POLICY "Service role can manage all profiles" 
ON profiles FOR ALL 
TO service_role
USING (true);

-- Create an admin view function to check authentication issues
CREATE OR REPLACE FUNCTION admin_check_auth_status(user_email TEXT)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  result JSON;
  user_id UUID;
BEGIN
  -- Get user ID from email
  SELECT id INTO user_id
  FROM auth.users
  WHERE email = user_email;
  
  IF user_id IS NULL THEN
    RETURN json_build_object(
      'exists', false,
      'message', 'User does not exist in auth.users'
    );
  END IF;
  
  -- Get auth user details and profile details
  SELECT json_build_object(
    'exists', true,
    'auth_user', (
      SELECT row_to_json(u)
      FROM auth.users u
      WHERE u.id = user_id
    ),
    'profile', (
      SELECT row_to_json(p)
      FROM profiles p
      WHERE p.id = user_id
    ),
    'has_profile', EXISTS (
      SELECT 1
      FROM profiles p
      WHERE p.id = user_id
    )
  ) INTO result;
  
  RETURN result;
END;
$$; 