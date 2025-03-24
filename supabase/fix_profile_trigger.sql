-- Improved trigger function that extracts first_name and last_name from user metadata
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  first_name TEXT := '';
  last_name TEXT := '';
  success BOOLEAN;
BEGIN
  -- Try to get first_name and last_name from user metadata
  IF NEW.raw_user_meta_data->>'first_name' IS NOT NULL THEN
    first_name := NEW.raw_user_meta_data->>'first_name';
  END IF;
  
  IF NEW.raw_user_meta_data->>'last_name' IS NOT NULL THEN
    last_name := NEW.raw_user_meta_data->>'last_name';
  END IF;
  
  -- Fall back to default values if empty
  IF first_name = '' THEN
    first_name := 'New';
  END IF;
  
  IF last_name = '' THEN
    last_name := 'User';
  END IF;

  -- Insert the profile with exception handling
  BEGIN
    -- Check if profile already exists to avoid duplicates
    IF NOT EXISTS (SELECT 1 FROM profiles WHERE id = NEW.id) THEN
      INSERT INTO profiles (id, first_name, last_name, role)
      VALUES (NEW.id, first_name, last_name, 'patient');
      success := TRUE;
    ELSE
      -- Profile already exists, no need to create
      success := TRUE;
    END IF;
  EXCEPTION WHEN OTHERS THEN
    -- Log the error (will appear in Supabase logs)
    RAISE WARNING 'Error creating profile for user %: %', NEW.id, SQLERRM;
    success := FALSE;
  END;
  
  -- Always return NEW to continue the transaction, even if profile creation fails
  -- This ensures the auth user is still created even if profile creation fails
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER; 