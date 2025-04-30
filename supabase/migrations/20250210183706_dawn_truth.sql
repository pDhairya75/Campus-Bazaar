-- Add rating column to products if it doesn't exist
ALTER TABLE products ADD COLUMN IF NOT EXISTS rating numeric(2,1) DEFAULT 0;

-- Fix reviews query by specifying the correct relationship
DROP POLICY IF EXISTS "Reviews are viewable by everyone" ON reviews;
CREATE POLICY "Reviews are viewable by everyone"
  ON reviews FOR SELECT
  USING (true);

-- Update the reviews query to use the correct relationship
CREATE OR REPLACE FUNCTION get_user_reviews(user_id uuid)
RETURNS TABLE (
  id uuid,
  rating integer,
  comment text,
  created_at timestamptz,
  categories jsonb,
  reviewer_name text,
  reviewer_avatar text
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    r.id,
    r.rating,
    r.comment,
    r.created_at,
    r.categories,
    p.full_name as reviewer_name,
    p.avatar_url as reviewer_avatar
  FROM reviews r
  JOIN profiles p ON p.id = r.reviewer_id
  WHERE r.user_id = get_user_reviews.user_id
  ORDER BY r.created_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;