-- Reference to uuid-ossp extension (should be enabled in previous migration)
-- CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create categories table with soft delete
CREATE TABLE IF NOT EXISTS categories (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(100) NOT NULL,
  description TEXT,
  color VARCHAR(50),
  icon VARCHAR(50),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at TIMESTAMPTZ DEFAULT NULL,
  created_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  is_active BOOLEAN NOT NULL DEFAULT TRUE
);

-- Create a partial unique index instead of using WHERE in the UNIQUE constraint
CREATE UNIQUE INDEX categories_name_created_by_idx ON categories (name, created_by) WHERE deleted_at IS NULL;

-- Add RLS (Row Level Security) policies
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;

-- Policy for all users to view non-deleted categories
CREATE POLICY "All users can view non-deleted categories"
ON categories FOR SELECT
USING (deleted_at IS NULL);

-- Policy for superadmins to view all categories including deleted ones
CREATE POLICY "Superadmins and managers can view all categories"
ON categories FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM user_roles
    WHERE user_id = auth.uid() AND role IN ('superadmin', 'manager')
  )
);

-- Policy to allow any authenticated user to create categories
CREATE POLICY "Users can insert their own categories"
ON categories FOR INSERT
WITH CHECK (auth.uid() = created_by);

-- Policy to allow creator users to update their own categories (if not deleted)
CREATE POLICY "Users can update their own categories"
ON categories FOR UPDATE
USING (
  auth.uid() = created_by AND
  deleted_at IS NULL
);

-- Policy to allow superadmins to update any category
CREATE POLICY "Superadmins and managers can update any category"
ON categories FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM user_roles
    WHERE user_id = auth.uid() AND role IN ('superadmin', 'manager')
  )
);

-- Policy to allow superadmins to hard delete categories
CREATE POLICY "Superadmins can delete categories"
ON categories FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM user_roles
    WHERE user_id = auth.uid() AND role = 'superadmin'
  )
);

-- Create function for automatic updated_at
CREATE OR REPLACE FUNCTION update_categories_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for automatic updated_at
CREATE TRIGGER update_categories_updated_at
BEFORE UPDATE ON categories
FOR EACH ROW
EXECUTE FUNCTION update_categories_updated_at();

-- Create function for soft delete
CREATE OR REPLACE FUNCTION soft_delete_category()
RETURNS TRIGGER AS $$
BEGIN
  -- Check if user is superadmin, if not, perform soft delete
  IF NOT EXISTS (
    SELECT 1 FROM user_roles
    WHERE user_id = auth.uid() AND role = 'superadmin'
  ) THEN
    UPDATE categories
    SET deleted_at = NOW()
    WHERE id = OLD.id AND created_by = auth.uid();
    RETURN NULL;
  END IF;
  -- If user is superadmin, allow the hard delete to proceed
  RETURN OLD;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to catch delete attempts and convert them to soft deletes for non-superadmins
CREATE TRIGGER soft_delete_categories_trigger
BEFORE DELETE ON categories
FOR EACH ROW
EXECUTE FUNCTION soft_delete_category();

-- Add comment to the table
COMMENT ON TABLE categories IS 'Table to store categories with different permissions for users and superadmins.';
