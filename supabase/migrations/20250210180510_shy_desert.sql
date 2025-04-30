/*
  # Initial Schema for Campus Bazaar

  1. New Tables
    - `profiles`
      - User profiles with additional information
      - Links to Supabase auth.users
    - `campuses`
      - List of supported college campuses
    - `products`
      - Product listings with details
    - `categories`
      - Product categories
    - `chats`
      - Chat conversations between users
    - `messages`
      - Individual chat messages
    
  2. Security
    - Enable RLS on all tables
    - Add policies for authenticated users
*/

-- Create enum for product status
CREATE TYPE product_status AS ENUM ('available', 'sold', 'reserved');

-- Create enum for product condition
CREATE TYPE product_condition AS ENUM ('new', 'like_new', 'good', 'fair', 'poor');

-- Campuses table
CREATE TABLE IF NOT EXISTS campuses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  location text NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Categories table
CREATE TABLE IF NOT EXISTS categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  slug text NOT NULL UNIQUE,
  created_at timestamptz DEFAULT now()
);

-- Profiles table
CREATE TABLE IF NOT EXISTS profiles (
  id uuid PRIMARY KEY REFERENCES auth.users ON DELETE CASCADE,
  full_name text,
  campus_id uuid REFERENCES campuses,
  student_id text,
  phone text,
  rating numeric(2,1) DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Products table
CREATE TABLE IF NOT EXISTS products (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text,
  price decimal(10,2) NOT NULL,
  condition product_condition NOT NULL,
  status product_status DEFAULT 'available',
  seller_id uuid REFERENCES profiles NOT NULL,
  category_id uuid REFERENCES categories NOT NULL,
  campus_id uuid REFERENCES campuses NOT NULL,
  images text[] DEFAULT '{}',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Chats table
CREATE TABLE IF NOT EXISTS chats (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id uuid REFERENCES products NOT NULL,
  buyer_id uuid REFERENCES profiles NOT NULL,
  seller_id uuid REFERENCES profiles NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Messages table
CREATE TABLE IF NOT EXISTS messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  chat_id uuid REFERENCES chats NOT NULL,
  sender_id uuid REFERENCES profiles NOT NULL,
  content text NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE chats ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE campuses ENABLE ROW LEVEL SECURITY;
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;

-- Policies

-- Profiles policies
CREATE POLICY "Public profiles are viewable by everyone"
  ON profiles FOR SELECT
  USING (true);

CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  USING (auth.uid() = id);

-- Products policies
CREATE POLICY "Products are viewable by everyone"
  ON products FOR SELECT
  USING (true);

CREATE POLICY "Users can insert own products"
  ON products FOR INSERT
  WITH CHECK (auth.uid() = seller_id);

CREATE POLICY "Users can update own products"
  ON products FOR UPDATE
  USING (auth.uid() = seller_id);

-- Chats policies
CREATE POLICY "Users can view their chats"
  ON chats FOR SELECT
  USING (auth.uid() = buyer_id OR auth.uid() = seller_id);

CREATE POLICY "Users can create chats"
  ON chats FOR INSERT
  WITH CHECK (auth.uid() = buyer_id);

-- Messages policies
CREATE POLICY "Chat participants can view messages"
  ON messages FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM chats
      WHERE chats.id = messages.chat_id
      AND (chats.buyer_id = auth.uid() OR chats.seller_id = auth.uid())
    )
  );

CREATE POLICY "Chat participants can insert messages"
  ON messages FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM chats
      WHERE chats.id = messages.chat_id
      AND (chats.buyer_id = auth.uid() OR chats.seller_id = auth.uid())
    )
  );

-- Campus and categories are viewable by everyone
CREATE POLICY "Campuses are viewable by everyone"
  ON campuses FOR SELECT
  USING (true);

CREATE POLICY "Categories are viewable by everyone"
  ON categories FOR SELECT
  USING (true);

-- Insert initial categories
INSERT INTO categories (name, slug) VALUES
  ('Furniture', 'furniture'),
  ('Electronics', 'electronics'),
  ('Sports Equipment', 'sports'),
  ('Study Materials', 'study'),
  ('Gaming Devices', 'gaming'),
  ('Books', 'books'),
  ('Others', 'others');