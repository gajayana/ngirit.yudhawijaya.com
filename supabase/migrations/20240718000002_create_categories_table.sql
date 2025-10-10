-- Reference to uuid-ossp extension (should be enabled in previous migration)
-- CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create categories table with soft delete
CREATE TABLE IF NOT EXISTS categories (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(100) NOT NULL,
  description TEXT,
  color VARCHAR(50),
  icon VARCHAR(50),
  type VARCHAR(10) NOT NULL DEFAULT 'expense' CHECK (type IN ('income', 'expense')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at TIMESTAMPTZ DEFAULT NULL,
  created_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  is_active BOOLEAN NOT NULL DEFAULT TRUE
);

-- Create a partial unique index instead of using WHERE in the UNIQUE constraint
CREATE UNIQUE INDEX categories_name_type_created_by_idx ON categories (name, type, created_by) WHERE deleted_at IS NULL;

-- Create index for better performance when filtering by type
CREATE INDEX categories_type_idx ON categories (type);

-- Add RLS (Row Level Security) policies
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;

-- Consolidated SELECT policy (optimized with SELECT (SELECT auth.uid()))
CREATE POLICY "Users can view categories based on role"
ON categories FOR SELECT
USING (
  -- All users can view non-deleted categories
  deleted_at IS NULL
  OR
  -- Superadmins and managers can view all categories
  EXISTS (
    SELECT 1 FROM user_data
    WHERE user_id = (SELECT auth.uid()) AND role IN ('superadmin', 'manager')
  )
);

-- INSERT policy (optimized with SELECT (SELECT auth.uid()))
CREATE POLICY "Users can insert their own categories"
ON categories FOR INSERT
WITH CHECK ((SELECT auth.uid()) = created_by);

-- Consolidated UPDATE policy (optimized with SELECT (SELECT auth.uid()))
CREATE POLICY "Users can update categories based on role"
ON categories FOR UPDATE
USING (
  -- Users can update their own non-deleted categories
  ((SELECT auth.uid()) = created_by AND deleted_at IS NULL)
  OR
  -- Superadmins and managers can update any category
  EXISTS (
    SELECT 1 FROM user_data
    WHERE user_id = (SELECT auth.uid()) AND role IN ('superadmin', 'manager')
  )
);

-- DELETE policy (optimized with SELECT (SELECT auth.uid()))
CREATE POLICY "Superadmins can delete categories"
ON categories FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM user_data
    WHERE user_id = (SELECT auth.uid()) AND role = 'superadmin'
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

-- Create function for soft delete (optimized with SELECT (SELECT auth.uid()))
CREATE OR REPLACE FUNCTION soft_delete_category()
RETURNS TRIGGER AS $$
BEGIN
  -- Check if user is superadmin, if not, perform soft delete
  IF NOT EXISTS (
    SELECT 1 FROM user_data
    WHERE user_id = (SELECT auth.uid()) AND role = 'superadmin'
  ) THEN
    UPDATE categories
    SET deleted_at = NOW()
    WHERE id = OLD.id AND created_by = (SELECT auth.uid());
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

-- Add comments to the table and columns
COMMENT ON TABLE categories IS 'Table to store income and expense categories with different permissions for users and superadmins.';
COMMENT ON COLUMN categories.type IS 'Category type: income or expense';
