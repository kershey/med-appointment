-- Create a function to handle new doctor profiles
CREATE OR REPLACE FUNCTION handle_new_doctor_profile()
RETURNS TRIGGER AS $$
BEGIN
  -- If the new profile is a doctor and there's no corresponding record in doctors table
  IF NEW.role = 'doctor' THEN
    -- Check if a doctor entry already exists to avoid duplicates
    IF NOT EXISTS (SELECT 1 FROM doctors WHERE id = NEW.id) THEN
      -- Insert a new doctor record with default values
      INSERT INTO doctors (
        id, 
        specialty, 
        license_number, 
        consultation_fee, 
        created_at, 
        updated_at
      ) 
      VALUES (
        NEW.id, 
        'General Medicine', -- Default specialty
        'PENDING', -- Default license number
        0.00, -- Default consultation fee
        NOW(),
        NOW()
      );
      
      RAISE LOG 'Created doctor record for profile %', NEW.id;
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop the trigger if it already exists
DROP TRIGGER IF EXISTS on_doctor_profile_created ON profiles;

-- Create the trigger
CREATE TRIGGER on_doctor_profile_created
  AFTER INSERT OR UPDATE OF role ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION handle_new_doctor_profile();

-- Run a one-time sync to create doctor records for any existing doctor profiles
DO $$
DECLARE
  doc_profile RECORD;
BEGIN
  FOR doc_profile IN (
    SELECT p.id
    FROM profiles p
    LEFT JOIN doctors d ON p.id = d.id
    WHERE p.role = 'doctor' AND d.id IS NULL
  ) LOOP
    INSERT INTO doctors (
      id, 
      specialty, 
      license_number, 
      consultation_fee, 
      created_at, 
      updated_at
    ) 
    VALUES (
      doc_profile.id, 
      'General Medicine', 
      'PENDING', 
      0.00, 
      NOW(),
      NOW()
    );
    
    RAISE LOG 'Created missing doctor record for profile %', doc_profile.id;
  END LOOP;
END;
$$; 