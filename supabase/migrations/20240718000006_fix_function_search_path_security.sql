-- Migration: Fix function search_path security warnings
-- This migration updates existing functions to use empty search_path for security

-- Fix update_updated_at_column function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = '';

-- Fix update_categories_updated_at function
CREATE OR REPLACE FUNCTION update_categories_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = '';

-- Fix update_currencies_updated_at function
CREATE OR REPLACE FUNCTION update_currencies_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = '';

-- Fix update_transactions_updated_at function
CREATE OR REPLACE FUNCTION update_transactions_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = '';

-- Fix soft_delete_category function
CREATE OR REPLACE FUNCTION soft_delete_category()
RETURNS TRIGGER AS $$
BEGIN
  -- Check if user is superadmin, if not, perform soft delete
  IF NOT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid() AND role = 'superadmin'
  ) THEN
    UPDATE public.categories
    SET deleted_at = NOW()
    WHERE id = OLD.id AND created_by = auth.uid();
    RETURN NULL;
  END IF;
  -- If user is superadmin, allow the hard delete to proceed
  RETURN OLD;
END;
$$ LANGUAGE plpgsql SET search_path = '';

-- Fix soft_delete_currency function
CREATE OR REPLACE FUNCTION soft_delete_currency()
RETURNS TRIGGER AS $$
BEGIN
  -- Check if user is superadmin, if not, perform soft delete
  IF NOT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid() AND role = 'superadmin'
  ) THEN
    UPDATE public.currencies
    SET deleted_at = NOW()
    WHERE id = OLD.id AND created_by = auth.uid();
    RETURN NULL;
  END IF;
  -- If user is superadmin, allow the hard delete to proceed
  RETURN OLD;
END;
$$ LANGUAGE plpgsql SET search_path = '';

-- Fix soft_delete_transaction function
CREATE OR REPLACE FUNCTION soft_delete_transaction()
RETURNS TRIGGER AS $$
BEGIN
  -- Check if user is superadmin, if not, perform soft delete
  IF NOT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid() AND role = 'superadmin'
  ) THEN
    -- Only allow users to soft delete their own transactions
    IF OLD.created_by = auth.uid() THEN
      UPDATE public.transactions
      SET deleted_at = NOW()
      WHERE id = OLD.id;
    END IF;
    RETURN NULL;
  END IF;
  -- If user is superadmin, allow the hard delete to proceed
  RETURN OLD;
END;
$$ LANGUAGE plpgsql SET search_path = '';

-- Fix handle_new_user function
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'user');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = '';

-- Add comment
COMMENT ON FUNCTION update_updated_at_column() IS 'Trigger function to automatically update updated_at column - security hardened';
COMMENT ON FUNCTION update_categories_updated_at() IS 'Trigger function to automatically update categories updated_at column - security hardened';
COMMENT ON FUNCTION update_currencies_updated_at() IS 'Trigger function to automatically update currencies updated_at column - security hardened';
COMMENT ON FUNCTION update_transactions_updated_at() IS 'Trigger function to automatically update transactions updated_at column - security hardened';
COMMENT ON FUNCTION soft_delete_category() IS 'Trigger function for soft delete categories - security hardened';
COMMENT ON FUNCTION soft_delete_currency() IS 'Trigger function for soft delete currencies - security hardened';
COMMENT ON FUNCTION soft_delete_transaction() IS 'Trigger function for soft delete transactions - security hardened';
COMMENT ON FUNCTION handle_new_user() IS 'Trigger function to handle new user registration - security hardened';
