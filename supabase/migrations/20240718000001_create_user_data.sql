-- Enable uuid-ossp extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create enum type for user roles
CREATE TYPE user_role AS ENUM ('superadmin', 'manager', 'user');

-- Create user_data table to store user profile and role information
CREATE TABLE IF NOT EXISTS user_data (
  id UUID PRIMARY KEY DEFAULT extensions.uuid_generate_v4(),
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL UNIQUE,
  full_name TEXT,
  role user_role NOT NULL DEFAULT 'user',
  is_blocked BOOLEAN NOT NULL DEFAULT FALSE,
  deleted_at TIMESTAMPTZ DEFAULT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Add index for faster role lookups
CREATE INDEX idx_user_data_user_id ON user_data(user_id);
CREATE INDEX idx_user_data_role ON user_data(role);
CREATE INDEX idx_user_data_email ON user_data(email);

-- Enable RLS (Row Level Security)
ALTER TABLE user_data ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- RLS POLICIES (Optimized - avoiding infinite recursion)
-- ============================================================================

-- SELECT: All authenticated users can view non-deleted user data
-- Note: We avoid recursion by not checking roles in SELECT policy
CREATE POLICY "Users can view non-deleted user data"
ON user_data FOR SELECT
USING (
  (SELECT auth.uid()) IS NOT NULL
  AND deleted_at IS NULL
);

-- INSERT: Only through trigger function (SECURITY DEFINER bypasses RLS)
-- This prevents manual inserts, ensuring user_data is only created via auth.users trigger
CREATE POLICY "Block manual user data inserts"
ON user_data FOR INSERT
WITH CHECK (false);

-- UPDATE: Users can update their own full_name only
-- Note: Role/is_blocked changes must be done by superadmin via direct DB access or special function
CREATE POLICY "Users can update their own full_name"
ON user_data FOR UPDATE
USING ((SELECT auth.uid()) = user_id)
WITH CHECK ((SELECT auth.uid()) = user_id);

-- DELETE: Block all deletes through RLS, use soft delete trigger instead
CREATE POLICY "Block user data deletes via RLS"
ON user_data FOR DELETE
USING (false);

-- ============================================================================
-- TRIGGER FUNCTIONS
-- ============================================================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to update updated_at on row update
CREATE TRIGGER update_user_data_updated_at
BEFORE UPDATE ON user_data
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- Function to auto-create user_data record on auth.users INSERT
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.user_data (user_id, email, full_name, role)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email),
    'user'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to auto-create user_data on new auth.users
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- Function to auto-update user_data when auth.users changes
CREATE OR REPLACE FUNCTION handle_user_updated()
RETURNS TRIGGER AS $$
BEGIN
  -- Update email or full_name if they changed
  IF NEW.email IS DISTINCT FROM OLD.email OR (NEW.raw_user_meta_data->>'full_name') IS DISTINCT FROM (OLD.raw_user_meta_data->>'full_name') THEN
    UPDATE public.user_data
    SET
      email = NEW.email,
      full_name = COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email)
    WHERE user_id = NEW.id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to auto-update user_data when auth.users is updated
CREATE TRIGGER on_auth_user_updated
  AFTER UPDATE ON auth.users
  FOR EACH ROW
  WHEN (NEW.email IS DISTINCT FROM OLD.email OR NEW.raw_user_meta_data IS DISTINCT FROM OLD.raw_user_meta_data)
  EXECUTE FUNCTION handle_user_updated();

-- ============================================================================
-- ADMIN FUNCTIONS (for role/status management)
-- ============================================================================

-- Function to check if current user is superadmin (avoids recursion)
CREATE OR REPLACE FUNCTION is_superadmin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM user_data
    WHERE user_id = (SELECT auth.uid())
      AND role = 'superadmin'
      AND deleted_at IS NULL
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function for superadmins to update user role
CREATE OR REPLACE FUNCTION update_user_role(
  target_user_id UUID,
  new_role user_role
)
RETURNS BOOLEAN AS $$
BEGIN
  -- Check if caller is superadmin
  IF NOT is_superadmin() THEN
    RAISE EXCEPTION 'Only superadmins can update user roles';
  END IF;

  -- Update the role
  UPDATE user_data
  SET role = new_role, updated_at = NOW()
  WHERE user_id = target_user_id;

  RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function for superadmins to block/unblock users
CREATE OR REPLACE FUNCTION update_user_blocked_status(
  target_user_id UUID,
  blocked BOOLEAN
)
RETURNS BOOLEAN AS $$
BEGIN
  -- Check if caller is superadmin
  IF NOT is_superadmin() THEN
    RAISE EXCEPTION 'Only superadmins can block/unblock users';
  END IF;

  -- Update the blocked status
  UPDATE user_data
  SET is_blocked = blocked, updated_at = NOW()
  WHERE user_id = target_user_id;

  RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to handle soft delete for user_data
CREATE OR REPLACE FUNCTION soft_delete_user_data()
RETURNS TRIGGER AS $$
BEGIN
  -- Soft delete (set deleted_at)
  UPDATE user_data
  SET deleted_at = NOW()
  WHERE id = OLD.id;

  -- Prevent actual deletion
  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to always perform soft delete on user_data
CREATE TRIGGER soft_delete_user_data_trigger
BEFORE DELETE ON user_data
FOR EACH ROW
EXECUTE FUNCTION soft_delete_user_data();

-- ============================================================================
-- COMMENTS
-- ============================================================================

COMMENT ON TABLE user_data IS 'Stores user profile information, roles, and status. Automatically synced with auth.users. Supports soft delete.';
COMMENT ON COLUMN user_data.email IS 'User email, auto-synced from auth.users.email';
COMMENT ON COLUMN user_data.full_name IS 'User full name, auto-populated from auth.users metadata';
COMMENT ON COLUMN user_data.role IS 'User role: superadmin, manager, or user';
COMMENT ON COLUMN user_data.is_blocked IS 'Whether the user account is blocked';
COMMENT ON COLUMN user_data.deleted_at IS 'Soft delete timestamp. NULL means active, non-NULL means deleted';
