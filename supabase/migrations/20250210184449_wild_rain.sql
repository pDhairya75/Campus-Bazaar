-- Set admin status for specific user
DO $$ 
BEGIN
  -- First ensure the user exists in auth.users
  -- The user needs to sign up first through the application
  -- Then we can set them as admin

  -- Set admin status
  UPDATE profiles 
  SET is_admin = true 
  WHERE id IN (
    SELECT id 
    FROM auth.users 
    WHERE email = 'harshilvasani0014@gmail.com'
  );

  -- If no rows were updated, the user hasn't signed up yet
  IF NOT FOUND THEN
    RAISE NOTICE 'User with email harshilvasani0014@gmail.com not found. They need to sign up first.';
  END IF;
END $$;