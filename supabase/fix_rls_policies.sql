-- Check if this policy exists and create it if not
-- This allows users to insert their own profile
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'profiles' 
        AND policyname = 'Users can insert their own profile'
    ) THEN
        CREATE POLICY "Users can insert their own profile"
        ON profiles FOR INSERT
        WITH CHECK (auth.uid() = id);
    END IF;
END $$;

-- Check if this policy exists and create it if not
-- This allows the service role to insert profiles for any user
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'profiles' 
        AND policyname = 'Service role can insert any profile'
    ) THEN
        CREATE POLICY "Service role can insert any profile"
        ON profiles FOR INSERT
        TO service_role
        WITH CHECK (true);
    END IF;
END $$;

-- Add a policy for the auth trigger to insert profiles (security definer function)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'profiles' 
        AND policyname = 'Trigger can insert profiles'
    ) THEN
        CREATE POLICY "Trigger can insert profiles"
        ON profiles FOR INSERT
        WITH CHECK (true);
    END IF;
END $$;

-- Check if this policy exists and create it if not
-- This allows users to update their own profile
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'profiles' 
        AND policyname = 'Users can update their own profile'
    ) THEN
        CREATE POLICY "Users can update their own profile"
        ON profiles FOR UPDATE
        USING (auth.uid() = id);
    END IF;
END $$; 