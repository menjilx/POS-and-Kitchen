-- ============================================
-- AUTOMATE USER CREATION VIA TRIGGER
-- ============================================

-- Create a trigger function to automatically create a public user profile
-- when a new user signs up via Supabase Auth.
-- This bypasses RLS issues by running with security definer privileges.

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER 
LANGUAGE plpgsql
SECURITY DEFINER 
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.users (
    id,
    tenant_id,
    email,
    full_name,
    role,
    status
  )
  VALUES (
    NEW.id,
    (NEW.raw_user_meta_data->>'tenant_id')::uuid,
    NEW.email,
    NEW.raw_user_meta_data->>'full_name',
    COALESCE(NEW.raw_user_meta_data->>'role', 'staff'),
    COALESCE(NEW.raw_user_meta_data->>'status', 'active')
  );
  
  RETURN NEW;
END;
$$;

-- Create the trigger on the auth.users table
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Optional: Clean up the "Allow public insert" policy for users if it exists
-- since we now handle creation via trigger, clients don't need direct insert access
DROP POLICY IF EXISTS "Users can create their own profile" ON users;
