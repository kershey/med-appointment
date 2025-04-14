-- Add is_rejected column to profiles table if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_name = 'profiles'
        AND column_name = 'is_rejected'
    ) THEN
        ALTER TABLE profiles ADD COLUMN is_rejected BOOLEAN DEFAULT FALSE;
        
        -- Make sure existing rejected accounts are properly marked
        -- This assumes rejected accounts are those that are neither approved nor pending
        -- You may want to adjust this logic based on your specific requirements
        UPDATE profiles SET is_rejected = TRUE 
        WHERE role = 'doctor' AND is_approved = FALSE;
    END IF;
END
$$; 