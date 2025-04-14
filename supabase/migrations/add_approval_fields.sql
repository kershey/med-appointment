-- Add approval fields to the profiles table
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS is_approved BOOLEAN DEFAULT false;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS is_rejected BOOLEAN DEFAULT false;

-- Create a trigger to ensure only one doctor approval status is active at a time
CREATE OR REPLACE FUNCTION ensure_single_approval_status()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.is_approved = true AND NEW.is_rejected = true THEN
    RAISE EXCEPTION 'A doctor cannot be both approved and rejected';
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply the trigger to the profiles table
DROP TRIGGER IF EXISTS check_approval_status ON profiles;
CREATE TRIGGER check_approval_status
  BEFORE UPDATE ON profiles
  FOR EACH ROW
  WHEN (NEW.role = 'doctor')
  EXECUTE FUNCTION ensure_single_approval_status();

-- Create a function to redirect users to appropriate pages after login based on approval status
COMMENT ON COLUMN profiles.is_approved IS 'Whether the user (particularly doctors) is approved to use the system';
COMMENT ON COLUMN profiles.is_rejected IS 'Whether the user (particularly doctors) has been rejected'; 