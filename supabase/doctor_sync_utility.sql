-- 1. Check for doctor profiles without corresponding doctor records
SELECT p.id, p.first_name, p.last_name, p.role, p.is_approved
FROM profiles p
LEFT JOIN doctors d ON p.id = d.id
WHERE p.role = 'doctor' AND d.id IS NULL;

-- 2. Create doctor records for any missing entries found above
-- (This part is commented out for safety. Uncomment and run manually after reviewing results)
/*
INSERT INTO doctors (id, specialty, license_number, consultation_fee, created_at, updated_at)
SELECT 
  p.id, 
  'General Medicine', 
  'PENDING', 
  0.00, 
  NOW(), 
  NOW()
FROM profiles p
LEFT JOIN doctors d ON p.id = d.id
WHERE p.role = 'doctor' AND d.id IS NULL;
*/

-- 3. Check for any doctor records without corresponding profiles (should be rare/none)
SELECT d.id, d.specialty, d.license_number
FROM doctors d
LEFT JOIN profiles p ON d.id = p.id
WHERE p.id IS NULL OR p.role != 'doctor';

-- 4. Verify all doctor accounts have the is_approved field
SELECT id, first_name, last_name, role, is_approved
FROM profiles
WHERE role = 'doctor';

-- 5. Count total doctor profiles and doctor records
SELECT 
  (SELECT COUNT(*) FROM profiles WHERE role = 'doctor') AS doctor_profiles_count,
  (SELECT COUNT(*) FROM doctors) AS doctor_records_count; 