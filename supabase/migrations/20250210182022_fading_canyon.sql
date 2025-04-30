/*
  # Add Campus Management Features

  1. Schema Changes
    - Add unique constraint on campus name
  
  2. Data
    - Add PP SAVANI UNIVERSITY
  
  3. Security
    - Add admin policies for campus management
*/

-- Add unique constraint to campus name
ALTER TABLE campuses ADD CONSTRAINT campuses_name_key UNIQUE (name);

-- Insert PP SAVANI UNIVERSITY
INSERT INTO campuses (name, location)
VALUES ('PP SAVANI UNIVERSITY', 'Surat, Gujarat')
ON CONFLICT (name) DO NOTHING;

-- Add admin policies for campus management
CREATE POLICY "Admins can insert campuses"
  ON campuses FOR INSERT
  TO authenticated
  WITH CHECK (EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.is_admin = true
  ));

CREATE POLICY "Admins can update campuses"
  ON campuses FOR UPDATE
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.is_admin = true
  ));

CREATE POLICY "Admins can delete campuses"
  ON campuses FOR DELETE
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.is_admin = true
  ));