-- Fix any inconsistencies in doctor approvals
-- This will ensure all doctors have proper approval status

-- First, make sure all doctors that should be approved are marked correctly
UPDATE profiles
SET is_approved = true
WHERE role = 'doctor' 
AND id IN (
  SELECT d.id 
  FROM doctors d
  JOIN profiles p ON d.id = p.id
  WHERE (p.is_approved IS NULL OR p.is_approved = false)
  AND (p.is_rejected IS NULL OR p.is_rejected = false)
  -- Only include doctors that already have patients or appointments
  -- as a sign they are active in the system
  AND EXISTS (
    SELECT 1 FROM appointments a WHERE a.doctor_id = d.id
  )
);

-- Make sure all is_approved and is_rejected fields have valid values
UPDATE profiles
SET is_approved = COALESCE(is_approved, false),
    is_rejected = COALESCE(is_rejected, false)
WHERE role = 'doctor';

-- Make sure no doctors are both approved and rejected at the same time
UPDATE profiles
SET is_rejected = false
WHERE role = 'doctor'
AND is_approved = true
AND is_rejected = true;

-- Check for doctors with inconsistent data
SELECT 
  p.id, 
  p.first_name, 
  p.last_name, 
  d.specialty,
  p.is_approved,
  p.is_rejected
FROM profiles p
JOIN doctors d ON p.id = d.id
WHERE p.role = 'doctor'
AND (
  (p.is_approved = true AND p.is_rejected = true) OR
  (p.is_approved IS NULL) OR
  (p.is_rejected IS NULL)
); 