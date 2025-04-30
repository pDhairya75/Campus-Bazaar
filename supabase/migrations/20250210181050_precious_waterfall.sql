/*
  # Add Admin Role and Policies

  1. Changes
    - Add admin role to profiles table
    - Add RLS policies for admin access

  2. Security
    - Add admin-specific policies for all tables
    - Maintain existing RLS policies
*/

-- Add admin column to profiles if it doesn't exist
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'profiles' AND column_name = 'is_admin'
  ) THEN
    ALTER TABLE profiles ADD COLUMN is_admin boolean DEFAULT false;
  END IF;
END $$;

-- Add admin policies for all tables
DO $$ BEGIN
  -- Drop existing admin policies if they exist
  DROP POLICY IF EXISTS "Admins have full access to profiles" ON profiles;
  DROP POLICY IF EXISTS "Admins have full access to products" ON products;
  DROP POLICY IF EXISTS "Admins have full access to chats" ON chats;
  DROP POLICY IF EXISTS "Admins have full access to messages" ON messages;
  
  -- Create new admin policies
  CREATE POLICY "Admins have full access to profiles"
    ON profiles FOR ALL
    TO authenticated
    USING (
      (SELECT is_admin FROM profiles WHERE id = auth.uid()) = true
    )
    WITH CHECK (
      (SELECT is_admin FROM profiles WHERE id = auth.uid()) = true
    );

  CREATE POLICY "Admins have full access to products"
    ON products FOR ALL
    TO authenticated
    USING (
      (SELECT is_admin FROM profiles WHERE id = auth.uid()) = true
    )
    WITH CHECK (
      (SELECT is_admin FROM profiles WHERE id = auth.uid()) = true
    );

  CREATE POLICY "Admins have full access to chats"
    ON chats FOR ALL
    TO authenticated
    USING (
      (SELECT is_admin FROM profiles WHERE id = auth.uid()) = true
    )
    WITH CHECK (
      (SELECT is_admin FROM profiles WHERE id = auth.uid()) = true
    );

  CREATE POLICY "Admins have full access to messages"
    ON messages FOR ALL
    TO authenticated
    USING (
      (SELECT is_admin FROM profiles WHERE id = auth.uid()) = true
    )
    WITH CHECK (
      (SELECT is_admin FROM profiles WHERE id = auth.uid()) = true
    );
END $$;