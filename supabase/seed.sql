-- Seed file for Supabase database
-- This file runs after migrations when you run `supabase db reset`
-- Only contains data insertions, not schema statements

-- Insert default category "Tak Terkategori" for all users
-- Note: This uses a function to insert for each existing user

DO $$
DECLARE
  user_record RECORD;
BEGIN
  -- Loop through all users in auth.users
  FOR user_record IN
    SELECT id, email FROM auth.users
  LOOP
    -- Insert "Tak Terkategori" category if it doesn't exist for this user
    INSERT INTO categories (name, description, type, created_by)
    SELECT
      'Tak Terkategori',
      'Pengeluaran belum terkategori',
      'expense',
      user_record.id
    WHERE NOT EXISTS (
      SELECT 1 FROM categories
      WHERE name = 'Tak Terkategori'
      AND type = 'expense'
      AND created_by = user_record.id
      AND deleted_at IS NULL
    );

    RAISE NOTICE 'Created category for user: %', user_record.email;
  END LOOP;
END $$;
