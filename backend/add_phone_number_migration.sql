-- Migration: Add phone_number support to user metadata
-- This is handled automatically by Supabase Auth user_metadata field
-- No database migration needed as phone_number is stored in auth.users.user_metadata

-- However, if you want to create a profiles table with phone_number for easier querying:
-- (Optional - phone_number is already stored in user_metadata)

-- CREATE TABLE IF NOT EXISTS public.profiles (
--     id UUID REFERENCES auth.users(id) PRIMARY KEY,
--     full_name TEXT,
--     phone_number TEXT,
--     created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
--     updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
-- );

-- CREATE OR REPLACE FUNCTION public.handle_new_user()
-- RETURNS TRIGGER AS $$
-- BEGIN
--   INSERT INTO public.profiles (id, full_name, phone_number)
--   VALUES (
--     NEW.id,
--     NEW.raw_user_meta_data->>'full_name',
--     NEW.raw_user_meta_data->>'phone_number'
--   );
--   RETURN NEW;
-- END;
-- $$ LANGUAGE plpgsql SECURITY DEFINER;

-- CREATE TRIGGER on_auth_user_created
--   AFTER INSERT ON auth.users
--   FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Note: Phone numbers are currently stored in auth.users.raw_user_meta_data->>'phone_number'
-- This is accessible via user_metadata in the application
