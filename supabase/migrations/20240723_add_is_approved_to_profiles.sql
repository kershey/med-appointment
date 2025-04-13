-- Add is_approved column to profiles table if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_name = 'profiles'
        AND column_name = 'is_approved'
    ) THEN
        ALTER TABLE profiles ADD COLUMN is_approved BOOLEAN DEFAULT FALSE;
        
        -- Update all patient accounts to be automatically approved
        UPDATE profiles SET is_approved = TRUE WHERE role = 'patient';
    END IF;
END
$$; 