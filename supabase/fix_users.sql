-- This is a fix script to ensure consistency between auth.users and profiles tables
-- Run this in the Supabase SQL Editor to resolve any issues

-- Step 1: Find any auth.users that don't have corresponding profiles
WITH missing_profiles AS (
  SELECT au.id 
  FROM auth.users au
  LEFT JOIN public.profiles p ON au.id = p.id
  WHERE p.id IS NULL
)
-- Step 2: Insert profiles for any missing users
INSERT INTO public.profiles (id, user_id, first_name, last_name, role, created_at, updated_at)
SELECT 
  mp.id, 
  mp.id, 
  COALESCE((au.raw_user_meta_data->>'first_name')::TEXT, 'New'),
  COALESCE((au.raw_user_meta_data->>'last_name')::TEXT, 'User'),
  'patient',
  NOW(),
  NOW()
FROM missing_profiles mp
JOIN auth.users au ON mp.id = au.id;

-- Step 3: Fix any profiles where id != user_id
UPDATE public.profiles 
SET user_id = id
WHERE user_id != id;

-- Step 4: Log results
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
  WHERE p.id != p.user_id;
  
  RAISE NOTICE 'Auth users count: %', auth_count;
  RAISE NOTICE 'Profiles count: %', profile_count;
  RAISE NOTICE 'Profiles with id != user_id: %', mismatch_count;
END $$; 