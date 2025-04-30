-- Update admin user email
DO $$ 
BEGIN
  -- Set admin status for the correct email
  UPDATE profiles 
  SET is_admin = true 
  WHERE id IN (
    SELECT id 
    FROM auth.users 
    WHERE email = 'harshilvasani0011@gmail.com'
  );

  -- If no rows were updated, the user hasn't signed up yet
  IF NOT FOUND THEN
    RAISE NOTICE 'User with email harshilvasani0011@gmail.com not found. They need to sign up first.';
  END IF;
END $$;