/*
  # Fix RLS policies to avoid recursion

  1. Changes
    - Simplify admin policies to avoid circular references
    - Update existing policies to work alongside admin policies
    - Ensure proper access control for regular users and admins

  2. Security
    - Maintain strict access control
    - Prevent infinite recursion in policy checks
    - Keep existing functionality intact
*/

-- Drop existing problematic policies
DROP POLICY IF EXISTS "Admins have full access to profiles" ON profiles;
DROP POLICY IF EXISTS "Admins have full access to products" ON products;
DROP POLICY IF EXISTS "Admins have full access to chats" ON messages;
DROP POLICY IF EXISTS "Admins have full access to messages" ON messages;

-- Update profiles policies
DROP POLICY IF EXISTS "Public profiles are viewable by everyone" ON profiles;
CREATE POLICY "Profiles are viewable by everyone"
  ON profiles FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  USING (auth.uid() = id OR is_admin = true)
  WITH CHECK (auth.uid() = id OR is_admin = true);

-- Update products policies
DROP POLICY IF EXISTS "Products are viewable by everyone" ON products;
CREATE POLICY "Products are viewable by everyone"
  ON products FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "Users can insert own products" ON products;
CREATE POLICY "Users can insert own products"
  ON products FOR INSERT
  WITH CHECK (auth.uid() = seller_id OR EXISTS (
    SELECT 1 FROM profiles 
    WHERE id = auth.uid() AND is_admin = true
  ));

DROP POLICY IF EXISTS "Users can update own products" ON products;
CREATE POLICY "Users can update own products"
  ON products FOR UPDATE
  USING (auth.uid() = seller_id OR EXISTS (
    SELECT 1 FROM profiles 
    WHERE id = auth.uid() AND is_admin = true
  ));

-- Update chats policies
DROP POLICY IF EXISTS "Users can view their chats" ON chats;
CREATE POLICY "Users can view their chats"
  ON chats FOR SELECT
  USING (
    auth.uid() = buyer_id 
    OR auth.uid() = seller_id 
    OR EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() AND is_admin = true
    )
  );

DROP POLICY IF EXISTS "Users can create chats" ON chats;
CREATE POLICY "Users can create chats"
  ON chats FOR INSERT
  WITH CHECK (
    auth.uid() = buyer_id 
    OR EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() AND is_admin = true
    )
  );

-- Update messages policies
DROP POLICY IF EXISTS "Chat participants can view messages" ON messages;
CREATE POLICY "Chat participants can view messages"
  ON messages FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM chats
      WHERE chats.id = messages.chat_id
      AND (
        chats.buyer_id = auth.uid() 
        OR chats.seller_id = auth.uid()
        OR EXISTS (
          SELECT 1 FROM profiles 
          WHERE id = auth.uid() AND is_admin = true
        )
      )
    )
  );

DROP POLICY IF EXISTS "Chat participants can insert messages" ON messages;
CREATE POLICY "Chat participants can insert messages"
  ON messages FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM chats
      WHERE chats.id = chat_id
      AND (
        chats.buyer_id = auth.uid() 
        OR chats.seller_id = auth.uid()
        OR EXISTS (
          SELECT 1 FROM profiles 
          WHERE id = auth.uid() AND is_admin = true
        )
      )
    )
  );