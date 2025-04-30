-- Add status column to profiles for user banning
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS status text DEFAULT 'active' CHECK (status IN ('active', 'banned', 'suspended'));

-- Add status column to products for listing suspension
ALTER TABLE products ADD COLUMN IF NOT EXISTS moderation_status text DEFAULT 'active' CHECK (moderation_status IN ('active', 'suspended', 'under_review'));

-- Add status column to reports
ALTER TABLE reports ADD COLUMN IF NOT EXISTS status text DEFAULT 'pending' CHECK (status IN ('pending', 'resolved', 'dismissed'));

-- Create function to ban/unban users
CREATE OR REPLACE FUNCTION admin_update_user_status(user_id uuid, new_status text)
RETURNS void AS $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM profiles
    WHERE id = (SELECT id FROM auth.users WHERE id = auth.uid())
    AND is_admin = true
  ) THEN
    RAISE EXCEPTION 'Only administrators can update user status';
  END IF;

  UPDATE profiles
  SET status = new_status,
      updated_at = now()
  WHERE id = user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to update product moderation status
CREATE OR REPLACE FUNCTION admin_update_product_status(product_id uuid, new_status text)
RETURNS void AS $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM profiles
    WHERE id = (SELECT id FROM auth.users WHERE id = auth.uid())
    AND is_admin = true
  ) THEN
    RAISE EXCEPTION 'Only administrators can update product status';
  END IF;

  UPDATE products
  SET moderation_status = new_status,
      updated_at = now()
  WHERE id = product_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to update report status
CREATE OR REPLACE FUNCTION admin_update_report_status(report_id uuid, new_status text)
RETURNS void AS $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM profiles
    WHERE id = (SELECT id FROM auth.users WHERE id = auth.uid())
    AND is_admin = true
  ) THEN
    RAISE EXCEPTION 'Only administrators can update report status';
  END IF;

  UPDATE reports
  SET status = new_status,
      updated_at = now()
  WHERE id = report_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;