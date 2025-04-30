-- Add email column to profiles table
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS email text;

-- Create a trigger to automatically set email from auth.users
CREATE OR REPLACE FUNCTION sync_user_email()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE profiles
  SET email = (
    SELECT email
    FROM auth.users
    WHERE id = NEW.id
  )
  WHERE id = NEW.id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create the trigger
DROP TRIGGER IF EXISTS sync_user_email_trigger ON profiles;
CREATE TRIGGER sync_user_email_trigger
AFTER INSERT ON profiles
FOR EACH ROW
EXECUTE FUNCTION sync_user_email();

-- Sync existing emails
DO $$ 
BEGIN
  UPDATE profiles p
  SET email = u.email
  FROM auth.users u
  WHERE p.id = u.id
  AND p.email IS NULL;
END $$;