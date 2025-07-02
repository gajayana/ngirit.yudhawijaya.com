-- Reference to uuid-ossp extension (should be enabled in previous migration)
-- CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Migration: Create assets table for managing user savings, portfolios, cash, etc.

-- Create enum for asset types
DO $$ BEGIN
  CREATE TYPE asset_type AS ENUM (
    'cash',
    'savings_account',
    'investment_portfolio',
    'fixed_deposit',
    'checking_account',
    'retirement_fund',
    'cryptocurrency',
    'stocks',
    'bonds',
    'mutual_funds',
    'real_estate',
    'other'
  );
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- Create assets table
CREATE TABLE IF NOT EXISTS assets (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(255) NOT NULL, -- Name of the asset/account
  type asset_type NOT NULL, -- Type of asset
  currency_id UUID NOT NULL REFERENCES currencies(id) ON DELETE RESTRICT,
  current_balance DECIMAL(15,2) NOT NULL DEFAULT 0.00, -- Current balance/value
  initial_balance DECIMAL(15,2) DEFAULT 0.00, -- Initial amount when created
  description TEXT, -- Optional description
  account_number VARCHAR(100), -- Account number for bank accounts
  institution_name VARCHAR(255), -- Bank/broker/institution name
  interest_rate DECIMAL(5,4), -- Interest rate for savings/deposits (e.g., 2.5000 for 2.5%)
  maturity_date DATE, -- Maturity date for fixed deposits
  risk_level VARCHAR(20) CHECK (risk_level IN ('low', 'medium', 'high')), -- Risk level for investments
  is_liquid BOOLEAN NOT NULL DEFAULT TRUE, -- Whether the asset can be easily converted to cash
  auto_update_balance BOOLEAN NOT NULL DEFAULT FALSE, -- Whether balance updates automatically
  last_updated_balance TIMESTAMPTZ, -- When balance was last manually updated
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at TIMESTAMPTZ DEFAULT NULL,
  created_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  is_active BOOLEAN NOT NULL DEFAULT TRUE
);

-- Create indexes for assets
CREATE INDEX assets_created_by_idx ON assets (created_by) WHERE deleted_at IS NULL;
CREATE INDEX assets_type_idx ON assets (type) WHERE deleted_at IS NULL;
CREATE INDEX assets_currency_idx ON assets (currency_id) WHERE deleted_at IS NULL;
CREATE INDEX assets_institution_idx ON assets (institution_name) WHERE deleted_at IS NULL;
CREATE INDEX assets_is_active_idx ON assets (is_active) WHERE deleted_at IS NULL;
CREATE INDEX assets_maturity_date_idx ON assets (maturity_date) WHERE deleted_at IS NULL AND maturity_date IS NOT NULL;

-- Add RLS (Row Level Security) policies for assets
ALTER TABLE assets ENABLE ROW LEVEL SECURITY;

-- Policy for users to view their own non-deleted assets
CREATE POLICY "Users can view their own assets"
ON assets FOR SELECT
USING (
  auth.uid() = created_by AND
  deleted_at IS NULL
);

-- Policy for superadmins and managers to view all assets
CREATE POLICY "Superadmins and managers can view all assets"
ON assets FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM user_roles
    WHERE user_id = auth.uid() AND role IN ('superadmin', 'manager')
  )
);

-- Policy to allow authenticated users to create their own assets
CREATE POLICY "Users can insert their own assets"
ON assets FOR INSERT
WITH CHECK (auth.uid() = created_by);

-- Policy to allow users to update their own assets (if not deleted)
CREATE POLICY "Users can update their own assets"
ON assets FOR UPDATE
USING (
  auth.uid() = created_by AND
  deleted_at IS NULL
)
WITH CHECK (
  auth.uid() = created_by
);

-- Policy to allow superadmins and managers to update any asset
CREATE POLICY "Superadmins and managers can update any asset"
ON assets FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM user_roles
    WHERE user_id = auth.uid() AND role IN ('superadmin', 'manager')
  )
);

-- Policy to allow superadmins to hard delete assets
CREATE POLICY "Superadmins can delete assets"
ON assets FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM user_roles
    WHERE user_id = auth.uid() AND role = 'superadmin'
  )
);

-- Create function for automatic updated_at for assets
CREATE OR REPLACE FUNCTION update_assets_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  -- Update last_updated_balance if current_balance changed
  IF OLD.current_balance IS DISTINCT FROM NEW.current_balance THEN
    NEW.last_updated_balance = NOW();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = '';

-- Create trigger for automatic updated_at for assets
CREATE TRIGGER update_assets_updated_at
BEFORE UPDATE ON assets
FOR EACH ROW
EXECUTE FUNCTION update_assets_updated_at();

-- Create function for soft delete assets
CREATE OR REPLACE FUNCTION soft_delete_asset()
RETURNS TRIGGER AS $$
BEGIN
  -- Check if user is superadmin, if not, perform soft delete
  IF NOT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid() AND role = 'superadmin'
  ) THEN
    -- Only allow users to soft delete their own assets
    IF OLD.created_by = auth.uid() THEN
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

-- Create trigger to catch delete attempts and convert them to soft deletes for non-superadmins
CREATE TRIGGER soft_delete_assets_trigger
BEFORE DELETE ON assets
FOR EACH ROW
EXECUTE FUNCTION soft_delete_asset();

-- Create function to calculate total assets by currency for a user
CREATE OR REPLACE FUNCTION get_user_total_assets(user_uuid UUID, filter_currency_code VARCHAR DEFAULT NULL)
RETURNS TABLE (
  currency_id UUID,
  currency_code VARCHAR,
  total_balance DECIMAL(15,2),
  asset_count INTEGER
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    c.id as currency_id,
    c.code as currency_code,
    COALESCE(SUM(a.current_balance), 0)::DECIMAL(15,2) as total_balance,
    COUNT(a.id)::INTEGER as asset_count
  FROM public.currencies c
  LEFT JOIN public.assets a ON c.id = a.currency_id
    AND a.created_by = user_uuid
    AND a.deleted_at IS NULL
    AND a.is_active = TRUE
  WHERE c.deleted_at IS NULL
    AND (filter_currency_code IS NULL OR c.code = filter_currency_code)
  GROUP BY c.id, c.code
  HAVING (filter_currency_code IS NULL OR c.code = filter_currency_code)
  ORDER BY c.code;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = '';

-- Create function to get asset summary by type for a user
CREATE OR REPLACE FUNCTION get_user_assets_by_type(user_uuid UUID)
RETURNS TABLE (
  asset_type asset_type,
  total_balance DECIMAL(15,2),
  asset_count INTEGER,
  currency_code VARCHAR
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    a.type as asset_type,
    SUM(a.current_balance)::DECIMAL(15,2) as total_balance,
    COUNT(a.id)::INTEGER as asset_count,
    c.code as currency_code
  FROM public.assets a
  JOIN public.currencies c ON a.currency_id = c.id
  WHERE a.created_by = user_uuid
    AND a.deleted_at IS NULL
    AND a.is_active = TRUE
    AND c.deleted_at IS NULL
  GROUP BY a.type, c.code
  ORDER BY a.type, c.code;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = '';

-- Add comments to the table and columns
COMMENT ON TABLE assets IS 'Table to store user assets including savings, portfolios, cash, investments, etc.';
COMMENT ON COLUMN assets.type IS 'Type of asset (cash, savings_account, investment_portfolio, etc.)';
COMMENT ON COLUMN assets.current_balance IS 'Current balance or value of the asset';
COMMENT ON COLUMN assets.initial_balance IS 'Initial amount when the asset was created';
COMMENT ON COLUMN assets.interest_rate IS 'Interest rate for savings accounts or fixed deposits';
COMMENT ON COLUMN assets.risk_level IS 'Risk level for investment assets (low, medium, high)';
COMMENT ON COLUMN assets.is_liquid IS 'Whether the asset can be easily converted to cash';
COMMENT ON COLUMN assets.auto_update_balance IS 'Whether balance updates automatically from external sources';
COMMENT ON COLUMN assets.last_updated_balance IS 'Timestamp when balance was last manually updated';
