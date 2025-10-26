-- Reference to uuid-ossp extension (should be enabled in previous migration)
-- CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create transactions table with soft delete for both income and expenses
CREATE TABLE IF NOT EXISTS transactions (
  id UUID PRIMARY KEY DEFAULT extensions.uuid_generate_v4(),
  description VARCHAR(255) NOT NULL,
  amount DECIMAL(15, 2) NOT NULL CHECK (amount > 0),
  transaction_type VARCHAR(20) NOT NULL CHECK (transaction_type IN ('income', 'expense')),
  category UUID REFERENCES categories(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at TIMESTAMPTZ DEFAULT NULL,
  created_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  is_active BOOLEAN NOT NULL DEFAULT TRUE
);

-- Create index for better performance
CREATE INDEX transactions_category_idx ON transactions (category);
CREATE INDEX transactions_created_by_idx ON transactions (created_by);
CREATE INDEX transactions_deleted_at_idx ON transactions (deleted_at);
CREATE INDEX transactions_type_idx ON transactions (transaction_type);

-- Add RLS (Row Level Security) policies
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;

-- Policy for users to view only their own non-deleted transactions
CREATE POLICY "Users can view their own non-deleted transactions"
ON transactions FOR SELECT
USING (
  (SELECT auth.uid()) = created_by AND
  deleted_at IS NULL
);

-- Policy for managers to view all non-deleted transactions
CREATE POLICY "Managers can view all non-deleted transactions"
ON transactions FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM user_data
    WHERE user_id = (SELECT auth.uid()) AND role = 'manager'
  ) AND
  deleted_at IS NULL
);

-- Policy for superadmins to view all transactions including deleted ones
CREATE POLICY "Superadmins can view all transactions"
ON transactions FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM user_data
    WHERE user_id = (SELECT auth.uid()) AND role = 'superadmin'
  )
);

-- Policy to allow authenticated users to create their own transactions
CREATE POLICY "Users can insert their own transactions"
ON transactions FOR INSERT
WITH CHECK ((SELECT auth.uid()) = created_by);

-- Policy to allow superadmins to insert transactions on behalf of any user (for imports)
CREATE POLICY "Superadmins can insert any transaction"
ON transactions FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM user_data
    WHERE user_id = (SELECT auth.uid()) AND role = 'superadmin'
  )
);

-- Policy to allow users to update their own transactions (if not deleted)
CREATE POLICY "Users can update their own transactions"
ON transactions FOR UPDATE
USING (
  (SELECT auth.uid()) = created_by AND
  deleted_at IS NULL
);

-- Policy to allow managers to update any transaction
CREATE POLICY "Managers can update any transaction"
ON transactions FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM user_data
    WHERE user_id = (SELECT auth.uid()) AND role IN ('manager', 'superadmin')
  )
);

-- Policy to allow superadmins to hard delete transactions
CREATE POLICY "Superadmins can delete transactions"
ON transactions FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM user_data
    WHERE user_id = (SELECT auth.uid()) AND role = 'superadmin'
  )
);

-- Create function for automatic updated_at
CREATE OR REPLACE FUNCTION update_transactions_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for automatic updated_at
CREATE TRIGGER update_transactions_updated_at
BEFORE UPDATE ON transactions
FOR EACH ROW
EXECUTE FUNCTION update_transactions_updated_at();

-- Create function for soft delete
CREATE OR REPLACE FUNCTION soft_delete_transaction()
RETURNS TRIGGER AS $$
BEGIN
  -- Check if user is superadmin, if not, perform soft delete
  IF NOT EXISTS (
    SELECT 1 FROM user_data
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

-- Create trigger to catch delete attempts and convert them to soft deletes for non-superadmins
CREATE TRIGGER soft_delete_transactions_trigger
BEFORE DELETE ON transactions
FOR EACH ROW
EXECUTE FUNCTION soft_delete_transaction();

-- Add comment to the table
COMMENT ON TABLE transactions IS 'Table to store financial transactions (income and expenses) with different permissions for users, managers, and superadmins.';
