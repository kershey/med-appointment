-- Create a function to fix doctor approvals programmatically
CREATE OR REPLACE FUNCTION fix_doctor_approvals()
RETURNS INTEGER AS $$
DECLARE
  fixed_count INTEGER := 0;
BEGIN
  -- 1. Fix NULL values in is_approved and is_rejected columns
  UPDATE profiles
  SET 
    is_approved = COALESCE(is_approved, false),
    is_rejected = COALESCE(is_rejected, false)
  WHERE role = 'doctor'
  AND (is_approved IS NULL OR is_rejected IS NULL);
  
  GET DIAGNOSTICS fixed_count = ROW_COUNT;
  
  -- 2. Fix any cases of both approved and rejected being true (priority to approval)
  UPDATE profiles
  SET is_rejected = false
  WHERE role = 'doctor'
  AND is_approved = true
  AND is_rejected = true;
  
  -- 3. Make sure doctors with appointments are properly approved
  UPDATE profiles
  SET is_approved = true,
      is_rejected = false
  WHERE role = 'doctor'
  AND is_approved = false
  AND id IN (
    SELECT DISTINCT doctor_id FROM appointments
  );
  
  -- Return the number of fixed records
  RETURN fixed_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER; 