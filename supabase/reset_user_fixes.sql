-- Reset and improve trigger function

-- 1. Drop existing trigger and function first
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS handle_new_user();

-- 2. First run the profile/users sync to fix any existing users
DO $$
DECLARE
  fixed_count INTEGER := 0;
  missing_user RECORD;
BEGIN
  RAISE NOTICE 'Synchronizing auth.users and profiles tables...';
  
  -- Find users without profiles
  FOR missing_user IN (
    SELECT au.id,
           COALESCE((au.raw_user_meta_data->>'first_name')::TEXT, 'New') AS first_name,
           COALESCE((au.raw_user_meta_data->>'last_name')::TEXT, 'User') AS last_name
    FROM auth.users au
    LEFT JOIN public.profiles p ON au.id = p.id
    WHERE p.id IS NULL
  ) LOOP
    -- Create profile for each missing user
    BEGIN
      INSERT INTO public.profiles (id, user_id, first_name, last_name, role, created_at, updated_at)
      VALUES (
        missing_user.id,
        missing_user.id,
        missing_user.first_name,
        missing_user.last_name,
        'patient',
        NOW(),
        NOW()
      );
      
      fixed_count := fixed_count + 1;
      RAISE NOTICE 'Created profile for user: %', missing_user.id;
    EXCEPTION
      WHEN OTHERS THEN
        RAISE NOTICE 'Failed to create profile for user %: %', missing_user.id, SQLERRM;
    END;
  END LOOP;
  
  -- Fix profiles where id != user_id
  UPDATE public.profiles 
  SET user_id = id 
  WHERE user_id IS DISTINCT FROM id;
  
  RAISE NOTICE 'Fixed % missing profiles', fixed_count;
END $$;

-- 3. Create improved handle_new_user function
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  first_name_val TEXT;
  last_name_val TEXT;
BEGIN
  -- Get first_name and last_name from user metadata if available
  first_name_val := COALESCE(
    (NEW.raw_user_meta_data->>'first_name')::TEXT,
    'New'
  );
  
  last_name_val := COALESCE(
    (NEW.raw_user_meta_data->>'last_name')::TEXT,
    'User'
  );
  
  -- Use the auth user id for both id and user_id to ensure consistency
  INSERT INTO public.profiles (id, user_id, first_name, last_name, role)
  VALUES (NEW.id, NEW.id, first_name_val, last_name_val, 'patient')
  ON CONFLICT (id) DO NOTHING;
  
  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    RAISE LOG 'Error in handle_new_user function: %', SQLERRM;
    RETURN NEW;  -- Still return NEW so auth user is created
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4. Recreate the trigger with SECURITY DEFINER
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- 5. Create helper function to manually fill in missing profiles
CREATE OR REPLACE FUNCTION sync_missing_profiles()
RETURNS INTEGER AS $$
DECLARE
  inserted_count INTEGER := 0;
  missing_users RECORD;
BEGIN
  FOR missing_users IN (
    SELECT u.id, 
          COALESCE((u.raw_user_meta_data->>'first_name')::TEXT, 'New') AS first_name,
          COALESCE((u.raw_user_meta_data->>'last_name')::TEXT, 'User') AS last_name
    FROM auth.users u
    LEFT JOIN public.profiles p ON u.id = p.id
    WHERE p.id IS NULL
  ) LOOP
    BEGIN
      INSERT INTO public.profiles (id, user_id, first_name, last_name, role)
      VALUES (missing_users.id, missing_users.id, missing_users.first_name, missing_users.last_name, 'patient')
      ON CONFLICT DO NOTHING;
      
      inserted_count := inserted_count + 1;
    EXCEPTION
      WHEN OTHERS THEN
        RAISE LOG 'Error syncing profile for user %: %', missing_users.id, SQLERRM;
    END;
  END LOOP;
  
  RETURN inserted_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- 6. Check for any mismatched ids
DO $$
DECLARE
  auth_count INTEGER;
  profile_count INTEGER;
  mismatch_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO auth_count FROM auth.users;
  SELECT COUNT(*) INTO profile_count FROM public.profiles;
  SELECT COUNT(*) INTO mismatch_count 
  FROM public.profiles p
  WHERE p.id != p.user_id OR p.user_id IS NULL;
  
  RAISE NOTICE 'Auth users count: %', auth_count;
  RAISE NOTICE 'Profiles count: %', profile_count;
  RAISE NOTICE 'Profiles with id != user_id: %', mismatch_count;
END $$; 