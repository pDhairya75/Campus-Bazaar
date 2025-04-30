/*
  # Fix profiles RLS policies

  1. Changes
    - Add INSERT policy for profiles table to allow users to create their own profile
    - Ensure users can only create a profile with their own auth.uid

  2. Security
    - Maintains existing RLS policies
    - Adds secure INSERT policy for profiles
*/

-- Add INSERT policy for profiles
CREATE POLICY "Users can insert own profile"
  ON profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

-- Ensure existing policies are correct
DROP POLICY IF EXISTS "Profiles are viewable by everyone" ON profiles;
CREATE POLICY "Profiles are viewable by everyone"
  ON profiles FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);