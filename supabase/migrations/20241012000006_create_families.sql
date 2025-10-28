-- Migration: Create families and family_members tables
-- Created: 2024-10-12
-- Description: Enable family sharing feature where users can group together and share expense tracking

-- ============================================================================
-- Families Table
-- ============================================================================

CREATE TABLE families (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  created_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at TIMESTAMPTZ
);

-- ============================================================================
-- Family Members Junction Table
-- ============================================================================

CREATE TABLE family_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  family_id UUID NOT NULL REFERENCES families(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT NOT NULL DEFAULT 'member' CHECK (role IN ('owner', 'admin', 'member')),
  joined_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at TIMESTAMPTZ,
  UNIQUE(family_id, user_id)
);

-- ============================================================================
-- Indexes for Performance
-- ============================================================================

CREATE INDEX idx_families_created_by ON families(created_by) WHERE deleted_at IS NULL;
CREATE INDEX idx_family_members_family_id ON family_members(family_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_family_members_user_id ON family_members(user_id) WHERE deleted_at IS NULL;

-- ============================================================================
-- Helper Functions (SECURITY DEFINER to avoid infinite recursion)
-- ============================================================================

-- Check if user is a member of a family
CREATE OR REPLACE FUNCTION is_family_member(p_family_id UUID, p_user_id UUID)
RETURNS BOOLEAN
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM family_members
    WHERE family_id = p_family_id
    AND user_id = p_user_id
    AND deleted_at IS NULL
  );
END;
$$;

-- Check if user has a specific role in a family
CREATE OR REPLACE FUNCTION has_family_role(p_family_id UUID, p_user_id UUID, p_roles TEXT[])
RETURNS BOOLEAN
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM family_members
    WHERE family_id = p_family_id
    AND user_id = p_user_id
    AND role = ANY(p_roles)
    AND deleted_at IS NULL
  );
END;
$$;

-- ============================================================================
-- Row Level Security (RLS) Policies
-- ============================================================================

-- Enable RLS
ALTER TABLE families ENABLE ROW LEVEL SECURITY;
ALTER TABLE family_members ENABLE ROW LEVEL SECURITY;

-- ----------------------------------------------------------------------------
-- Families Policies
-- ----------------------------------------------------------------------------

-- Users can view families they belong to OR families they created
CREATE POLICY "Users can view their families"
  ON families FOR SELECT
  USING (
    is_family_member(id, (SELECT auth.uid()))
    OR created_by = (SELECT auth.uid())
  );

-- Users can create families
CREATE POLICY "Users can create families"
  ON families FOR INSERT
  WITH CHECK (created_by = (SELECT auth.uid()));

-- Only owners can update families
CREATE POLICY "Owners can update families"
  ON families FOR UPDATE
  USING (has_family_role(id, (SELECT auth.uid()), ARRAY['owner']));

-- Only owners can delete families (soft delete)
CREATE POLICY "Owners can delete families"
  ON families FOR DELETE
  USING (
    created_by = (SELECT auth.uid())
    AND deleted_at IS NULL
  );

-- ----------------------------------------------------------------------------
-- Family Members Policies
-- ----------------------------------------------------------------------------

-- Users can view members of their families
CREATE POLICY "Users can view family members"
  ON family_members FOR SELECT
  USING (is_family_member(family_id, (SELECT auth.uid())));

-- Owners and admins can add members, OR user is adding themselves (via trigger)
CREATE POLICY "Owners and admins can add members"
  ON family_members FOR INSERT
  WITH CHECK (
    has_family_role(family_id, (SELECT auth.uid()), ARRAY['owner', 'admin'])
    OR user_id = (SELECT auth.uid())
  );

-- Owners and admins can update members (change roles, soft delete)
CREATE POLICY "Owners and admins can update members"
  ON family_members FOR UPDATE
  USING (has_family_role(family_id, (SELECT auth.uid()), ARRAY['owner', 'admin']));

-- Only owners can permanently delete members
CREATE POLICY "Owners can delete members"
  ON family_members FOR DELETE
  USING (has_family_role(family_id, (SELECT auth.uid()), ARRAY['owner']));

-- ============================================================================
-- Triggers for updated_at
-- ============================================================================

CREATE TRIGGER update_families_updated_at
  BEFORE UPDATE ON families
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_family_members_updated_at
  BEFORE UPDATE ON family_members
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- Helper Function: Auto-create family_member entry when family is created
-- ============================================================================

CREATE OR REPLACE FUNCTION auto_add_creator_to_family()
RETURNS TRIGGER
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
DECLARE
  v_current_role TEXT;
BEGIN
  -- Automatically add the creator as owner when a family is created
  INSERT INTO family_members (family_id, user_id, role)
  VALUES (NEW.id, NEW.created_by, 'owner');

  -- Promote user to manager if they are currently just a regular user
  SELECT role INTO v_current_role
  FROM user_data
  WHERE user_id = NEW.created_by;

  IF v_current_role = 'user' THEN
    UPDATE user_data
    SET role = 'manager'
    WHERE user_id = NEW.created_by;

    RAISE NOTICE 'User % promoted to manager for creating a family', NEW.created_by;
  END IF;

  RETURN NEW;
END;
$$;

CREATE TRIGGER auto_add_creator_to_family_trigger
  AFTER INSERT ON families
  FOR EACH ROW EXECUTE FUNCTION auto_add_creator_to_family();

-- ============================================================================
-- Comments for Documentation
-- ============================================================================

COMMENT ON TABLE families IS 'Families allow users to group together and share expense tracking';
COMMENT ON TABLE family_members IS 'Junction table linking users to families with role-based permissions';
COMMENT ON COLUMN family_members.role IS 'Member role: owner (full control), admin (can manage members), member (view only)';
