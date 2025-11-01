-- Migration: Fix RLS policies to allow realtime events for soft-deleted transactions
-- Created: 2025-11-01
-- Description: Remove deleted_at IS NULL from SELECT policies to allow realtime UPDATE events
--              when transactions are soft-deleted. The application layer filters soft-deletes.

-- ============================================================================
-- Drop and Recreate SELECT Policies Without deleted_at Filter
-- ============================================================================

-- Drop existing policies
DROP POLICY IF EXISTS "Users can view their own non-deleted transactions" ON transactions;
DROP POLICY IF EXISTS "Users can view family members' transactions" ON transactions;
DROP POLICY IF EXISTS "Managers can view all non-deleted transactions" ON transactions;

-- Recreate: Users can view their own transactions (including soft-deleted for realtime)
CREATE POLICY "Users can view their own transactions"
  ON transactions FOR SELECT
  USING (
    (SELECT auth.uid()) = created_by
  );

-- Recreate: Users can view family members' transactions (including soft-deleted for realtime)
CREATE POLICY "Users can view family members' transactions"
  ON transactions FOR SELECT
  USING (
    is_family_transaction(created_by, (SELECT auth.uid()))
  );

-- Recreate: Managers can view all transactions (including soft-deleted for realtime)
CREATE POLICY "Managers can view all transactions"
  ON transactions FOR SELECT
  USING (
    EXISTS (
      SELECT 1
      FROM user_data
      WHERE user_data.user_id = (SELECT auth.uid())
      AND user_data.role = 'manager'::user_role
    )
  );

-- ============================================================================
-- Comments for Documentation
-- ============================================================================

COMMENT ON POLICY "Users can view their own transactions" ON transactions IS
  'Allows users to view all their own transactions (including soft-deleted) for realtime sync. Application layer filters deleted_at.';

COMMENT ON POLICY "Users can view family members' transactions" ON transactions IS
  'Allows users to view all transactions from family members (including soft-deleted) for realtime sync. Application layer filters deleted_at.';

COMMENT ON POLICY "Managers can view all transactions" ON transactions IS
  'Allows managers to view all transactions (including soft-deleted) for realtime sync. Application layer filters deleted_at.';
