-- Reference to uuid-ossp extension (should be enabled in previous migration)
-- CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Migration: Create currencies table

-- Create currencies table
CREATE TABLE IF NOT EXISTS currencies (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(100) NOT NULL,
  code VARCHAR(10) NOT NULL UNIQUE, -- Currency code like USD, EUR, IDR
  symbol VARCHAR(10), -- Currency symbol like $, €, Rp
  decimal_places INTEGER NOT NULL DEFAULT 2, -- Number of decimal places
  is_base_currency BOOLEAN NOT NULL DEFAULT FALSE, -- Mark base currency for conversion
  exchange_rate DECIMAL(15,6) NOT NULL DEFAULT 1.0, -- Exchange rate relative to base currency
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at TIMESTAMPTZ DEFAULT NULL,
  created_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  is_active BOOLEAN NOT NULL DEFAULT TRUE
);



-- Create indexes for currencies
CREATE INDEX currencies_code_idx ON currencies (code) WHERE deleted_at IS NULL;
CREATE INDEX currencies_created_by_idx ON currencies (created_by) WHERE deleted_at IS NULL;



-- Add RLS (Row Level Security) policies for currencies
ALTER TABLE currencies ENABLE ROW LEVEL SECURITY;

-- Policy for all users to view non-deleted currencies
CREATE POLICY "All users can view non-deleted currencies"
ON currencies FOR SELECT
USING (deleted_at IS NULL);

-- Policy for superadmins to view all currencies including deleted ones
CREATE POLICY "Superadmins and managers can view all currencies"
ON currencies FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM user_data
    WHERE user_id = (SELECT auth.uid()) AND role IN ('superadmin', 'manager')
  )
);

-- Policy to allow any authenticated user to create currencies
CREATE POLICY "Users can insert their own currencies"
ON currencies FOR INSERT
WITH CHECK ((SELECT auth.uid()) = created_by);

-- Policy to allow creator users to update their own currencies (if not deleted)
CREATE POLICY "Users can update their own currencies"
ON currencies FOR UPDATE
USING (
  (SELECT auth.uid()) = created_by AND
  deleted_at IS NULL
);

-- Policy to allow superadmins to update any currency
CREATE POLICY "Superadmins and managers can update any currency"
ON currencies FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM user_data
    WHERE user_id = (SELECT auth.uid()) AND role IN ('superadmin', 'manager')
  )
);

-- Policy to allow superadmins to hard delete currencies
CREATE POLICY "Superadmins can delete currencies"
ON currencies FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM user_data
    WHERE user_id = (SELECT auth.uid()) AND role = 'superadmin'
  )
);



-- Create function for automatic updated_at for currencies
CREATE OR REPLACE FUNCTION update_currencies_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for automatic updated_at for currencies
CREATE TRIGGER update_currencies_updated_at
BEFORE UPDATE ON currencies
FOR EACH ROW
EXECUTE FUNCTION update_currencies_updated_at();



-- Create function for soft delete currencies
CREATE OR REPLACE FUNCTION soft_delete_currency()
RETURNS TRIGGER AS $$
BEGIN
  -- Check if user is superadmin, if not, perform soft delete
  IF NOT EXISTS (
    SELECT 1 FROM user_data
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

-- Create trigger to catch delete attempts and convert them to soft deletes for non-superadmins
CREATE TRIGGER soft_delete_currencies_trigger
BEFORE DELETE ON currencies
FOR EACH ROW
EXECUTE FUNCTION soft_delete_currency();



-- Add comments to the table
COMMENT ON TABLE currencies IS 'Table to store currencies with exchange rates and conversion information.';
