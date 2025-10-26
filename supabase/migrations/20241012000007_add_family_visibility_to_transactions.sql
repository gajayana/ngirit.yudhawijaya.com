-- Migration: Add family visibility to transactions
-- Created: 2024-10-12
-- Description: Allow users to view transactions from family members they share a family with

-- ============================================================================
-- Helper Function (SECURITY DEFINER to avoid infinite recursion)
-- ============================================================================

-- Check if a user is in the same family as the transaction creator
CREATE OR REPLACE FUNCTION is_family_transaction(p_transaction_created_by UUID, p_user_id UUID)
RETURNS BOOLEAN
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
BEGIN
  -- Check if users share any family
  RETURN EXISTS (
    SELECT 1
    FROM family_members fm1
    JOIN family_members fm2 ON fm1.family_id = fm2.family_id
    WHERE fm1.user_id = p_user_id
    AND fm2.user_id = p_transaction_created_by
    AND fm1.deleted_at IS NULL
    AND fm2.deleted_at IS NULL
  );
END;
$$;

-- ============================================================================
-- Add Family Visibility to Transactions
-- ============================================================================

-- Add new policy for users to view family members' transactions
CREATE POLICY "Users can view family members' transactions"
  ON transactions FOR SELECT
  USING (
    is_family_transaction(created_by, (SELECT auth.uid()))
    AND deleted_at IS NULL
  );

-- ============================================================================
-- Comments for Documentation
-- ============================================================================

COMMENT ON POLICY "Users can view family members' transactions" ON transactions IS 'Allows users to view non-deleted transactions from other users in their families';
