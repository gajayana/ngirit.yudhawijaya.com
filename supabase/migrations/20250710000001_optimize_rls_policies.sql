-- Migration: Optimize RLS policies for performance
-- This migration addresses two main issues:
-- 1. auth_rls_initplan: Wraps auth.uid() calls with SELECT to prevent re-evaluation per row
-- 2. multiple_permissive_policies: Consolidates multiple permissive policies into single policies

-- ============================================================================
-- USER_ROLES TABLE POLICIES
-- ============================================================================

-- Drop existing policies
DROP POLICY IF EXISTS "Any authenticated user can view all roles" ON user_roles;
DROP POLICY IF EXISTS "Superadmins and managers can update roles" ON user_roles;
DROP POLICY IF EXISTS "Superadmins can delete roles" ON user_roles;

-- Recreate optimized policies
CREATE POLICY "Any authenticated user can view all roles"
ON user_roles FOR SELECT
USING ((SELECT auth.uid()) IS NOT NULL);

CREATE POLICY "Superadmins and managers can update roles"
ON user_roles FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM user_roles
    WHERE user_id = (SELECT auth.uid()) AND role IN ('superadmin', 'manager')
  )
);

CREATE POLICY "Superadmins can delete roles"
ON user_roles FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM user_roles
    WHERE user_id = (SELECT auth.uid()) AND role = 'superadmin'
  )
);

-- ============================================================================
-- CATEGORIES TABLE POLICIES
-- ============================================================================

-- Drop existing policies
DROP POLICY IF EXISTS "All users can view non-deleted categories" ON categories;
DROP POLICY IF EXISTS "Superadmins and managers can view all categories" ON categories;
DROP POLICY IF EXISTS "Users can insert their own categories" ON categories;
DROP POLICY IF EXISTS "Users can update their own categories" ON categories;
DROP POLICY IF EXISTS "Superadmins and managers can update any category" ON categories;
DROP POLICY IF EXISTS "Superadmins can delete categories" ON categories;

-- Recreate optimized and consolidated policies
-- Consolidated SELECT policy (combines two policies into one)
CREATE POLICY "Users can view categories based on role"
ON categories FOR SELECT
USING (
  -- All users can view non-deleted categories
  deleted_at IS NULL
  OR
  -- Superadmins and managers can view all categories
  EXISTS (
    SELECT 1 FROM user_roles
    WHERE user_id = (SELECT auth.uid()) AND role IN ('superadmin', 'manager')
  )
);

CREATE POLICY "Users can insert their own categories"
ON categories FOR INSERT
WITH CHECK ((SELECT auth.uid()) = created_by);

-- Consolidated UPDATE policy (combines two policies into one)
CREATE POLICY "Users can update categories based on role"
ON categories FOR UPDATE
USING (
  -- Users can update their own non-deleted categories
  ((SELECT auth.uid()) = created_by AND deleted_at IS NULL)
  OR
  -- Superadmins and managers can update any category
  EXISTS (
    SELECT 1 FROM user_roles
    WHERE user_id = (SELECT auth.uid()) AND role IN ('superadmin', 'manager')
  )
);

CREATE POLICY "Superadmins can delete categories"
ON categories FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM user_roles
    WHERE user_id = (SELECT auth.uid()) AND role = 'superadmin'
  )
);

-- ============================================================================
-- CURRENCIES TABLE POLICIES
-- ============================================================================

-- Drop existing policies
DROP POLICY IF EXISTS "All users can view non-deleted currencies" ON currencies;
DROP POLICY IF EXISTS "Superadmins and managers can view all currencies" ON currencies;
DROP POLICY IF EXISTS "Users can insert their own currencies" ON currencies;
DROP POLICY IF EXISTS "Users can update their own currencies" ON currencies;
DROP POLICY IF EXISTS "Superadmins and managers can update any currency" ON currencies;
DROP POLICY IF EXISTS "Superadmins can delete currencies" ON currencies;

-- Recreate optimized and consolidated policies
-- Consolidated SELECT policy
CREATE POLICY "Users can view currencies based on role"
ON currencies FOR SELECT
USING (
  -- All users can view non-deleted currencies
  deleted_at IS NULL
  OR
  -- Superadmins and managers can view all currencies
  EXISTS (
    SELECT 1 FROM user_roles
    WHERE user_id = (SELECT auth.uid()) AND role IN ('superadmin', 'manager')
  )
);

CREATE POLICY "Users can insert their own currencies"
ON currencies FOR INSERT
WITH CHECK ((SELECT auth.uid()) = created_by);

-- Consolidated UPDATE policy
CREATE POLICY "Users can update currencies based on role"
ON currencies FOR UPDATE
USING (
  -- Users can update their own non-deleted currencies
  ((SELECT auth.uid()) = created_by AND deleted_at IS NULL)
  OR
  -- Superadmins and managers can update any currency
  EXISTS (
    SELECT 1 FROM user_roles
    WHERE user_id = (SELECT auth.uid()) AND role IN ('superadmin', 'manager')
  )
);

CREATE POLICY "Superadmins can delete currencies"
ON currencies FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM user_roles
    WHERE user_id = (SELECT auth.uid()) AND role = 'superadmin'
  )
);

-- ============================================================================
-- TRANSACTIONS TABLE POLICIES
-- ============================================================================

-- Drop existing policies
DROP POLICY IF EXISTS "Users can view their own non-deleted transactions" ON transactions;
DROP POLICY IF EXISTS "Managers can view all non-deleted transactions" ON transactions;
DROP POLICY IF EXISTS "Superadmins can view all transactions" ON transactions;
DROP POLICY IF EXISTS "Users can insert their own transactions" ON transactions;
DROP POLICY IF EXISTS "Users can update their own transactions" ON transactions;
DROP POLICY IF EXISTS "Managers can update any transaction" ON transactions;
DROP POLICY IF EXISTS "Superadmins can delete transactions" ON transactions;

-- Recreate optimized and consolidated policies
-- Consolidated SELECT policy (combines three policies into one)
CREATE POLICY "Users can view transactions based on role"
ON transactions FOR SELECT
USING (
  -- Users can view their own non-deleted transactions
  ((SELECT auth.uid()) = created_by AND deleted_at IS NULL)
  OR
  -- Managers can view all non-deleted transactions
  (EXISTS (
    SELECT 1 FROM user_roles
    WHERE user_id = (SELECT auth.uid()) AND role = 'manager'
  ) AND deleted_at IS NULL)
  OR
  -- Superadmins can view all transactions
  EXISTS (
    SELECT 1 FROM user_roles
    WHERE user_id = (SELECT auth.uid()) AND role = 'superadmin'
  )
);

CREATE POLICY "Users can insert their own transactions"
ON transactions FOR INSERT
WITH CHECK ((SELECT auth.uid()) = created_by);

-- Consolidated UPDATE policy (combines two policies into one)
CREATE POLICY "Users can update transactions based on role"
ON transactions FOR UPDATE
USING (
  -- Users can update their own non-deleted transactions
  ((SELECT auth.uid()) = created_by AND deleted_at IS NULL)
  OR
  -- Managers and superadmins can update any transaction
  EXISTS (
    SELECT 1 FROM user_roles
    WHERE user_id = (SELECT auth.uid()) AND role IN ('manager', 'superadmin')
  )
);

CREATE POLICY "Superadmins can delete transactions"
ON transactions FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM user_roles
    WHERE user_id = (SELECT auth.uid()) AND role = 'superadmin'
  )
);

-- ============================================================================
-- ASSETS TABLE POLICIES
-- ============================================================================

-- Drop existing policies
DROP POLICY IF EXISTS "Users can view their own assets" ON assets;
DROP POLICY IF EXISTS "Superadmins and managers can view all assets" ON assets;
DROP POLICY IF EXISTS "Users can insert their own assets" ON assets;
DROP POLICY IF EXISTS "Users can update their own assets" ON assets;
DROP POLICY IF EXISTS "Superadmins and managers can update any asset" ON assets;
DROP POLICY IF EXISTS "Superadmins can delete assets" ON assets;

-- Recreate optimized and consolidated policies
-- Consolidated SELECT policy (combines two policies into one)
CREATE POLICY "Users can view assets based on role"
ON assets FOR SELECT
USING (
  -- Users can view their own non-deleted assets
  ((SELECT auth.uid()) = created_by AND deleted_at IS NULL)
  OR
  -- Superadmins and managers can view all assets
  EXISTS (
    SELECT 1 FROM user_roles
    WHERE user_id = (SELECT auth.uid()) AND role IN ('superadmin', 'manager')
  )
);

CREATE POLICY "Users can insert their own assets"
ON assets FOR INSERT
WITH CHECK ((SELECT auth.uid()) = created_by);

-- Consolidated UPDATE policy (combines two policies into one)
CREATE POLICY "Users can update assets based on role"
ON assets FOR UPDATE
USING (
  -- Users can update their own non-deleted assets
  ((SELECT auth.uid()) = created_by AND deleted_at IS NULL)
  OR
  -- Superadmins and managers can update any asset
  EXISTS (
    SELECT 1 FROM user_roles
    WHERE user_id = (SELECT auth.uid()) AND role IN ('superadmin', 'manager')
  )
)
WITH CHECK (
  -- Ensure users can only update their own assets unless they're admin
  (SELECT auth.uid()) = created_by
  OR
  EXISTS (
    SELECT 1 FROM user_roles
    WHERE user_id = (SELECT auth.uid()) AND role IN ('superadmin', 'manager')
  )
);

CREATE POLICY "Superadmins can delete assets"
ON assets FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM user_roles
    WHERE user_id = (SELECT auth.uid()) AND role = 'superadmin'
  )
);

-- ============================================================================
-- UPDATE TRIGGER FUNCTIONS
-- ============================================================================

-- Update soft delete functions to use (SELECT auth.uid())
CREATE OR REPLACE FUNCTION soft_delete_category()
RETURNS TRIGGER AS $$
BEGIN
  -- Check if user is superadmin, if not, perform soft delete
  IF NOT EXISTS (
    SELECT 1 FROM user_roles
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

CREATE OR REPLACE FUNCTION soft_delete_currency()
RETURNS TRIGGER AS $$
BEGIN
  -- Check if user is superadmin, if not, perform soft delete
  IF NOT EXISTS (
    SELECT 1 FROM user_roles
    WHERE user_id = (SELECT auth.uid()) AND role = 'superadmin'
  ) THEN
    UPDATE currencies
    SET deleted_at = NOW()
    WHERE id = OLD.id AND created_by = (SELECT auth.uid());
    RETURN NULL;
  END IF;
  -- If user is superadmin, allow the hard delete to proceed
  RETURN OLD;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION soft_delete_transaction()
RETURNS TRIGGER AS $$
BEGIN
  -- Check if user is superadmin, if not, perform soft delete
  IF NOT EXISTS (
    SELECT 1 FROM user_roles
    WHERE user_id = (SELECT auth.uid()) AND role = 'superadmin'
  ) THEN
    -- Only allow users to soft delete their own transactions
    IF OLD.created_by = (SELECT auth.uid()) THEN
      UPDATE transactions
      SET deleted_at = NOW()
      WHERE id = OLD.id AND created_by = (SELECT auth.uid());
    END IF;
    RETURN NULL;
  END IF;
  -- If user is superadmin, allow the hard delete to proceed
  RETURN OLD;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION soft_delete_asset()
RETURNS TRIGGER AS $$
BEGIN
  -- Check if user is superadmin, if not, perform soft delete
  IF NOT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = (SELECT auth.uid()) AND role = 'superadmin'
  ) THEN
    -- Only allow users to soft delete their own assets
    IF OLD.created_by = (SELECT auth.uid()) THEN
      UPDATE public.assets
      SET deleted_at = NOW(), is_active = FALSE
      WHERE id = OLD.id;
    END IF;
    RETURN NULL;
  END IF;
  -- If user is superadmin, allow the hard delete to proceed
  RETURN OLD;
END;
$$ LANGUAGE plpgsql SET search_path = '';

-- Add comment to the migration
COMMENT ON SCHEMA public IS 'RLS policies optimized for performance by wrapping auth.uid() with SELECT and consolidating multiple permissive policies';
