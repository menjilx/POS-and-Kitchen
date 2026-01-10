-- ============================================
-- FIX SIGNUP RLS POLICIES
-- ============================================

-- Allow public to create tenants (needed for signup)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM pg_policies
        WHERE schemaname = 'public'
        AND tablename = 'tenants'
        AND policyname = 'Allow public to create tenants'
    ) THEN
        CREATE POLICY "Allow public to create tenants" ON tenants FOR INSERT WITH CHECK (true);
    END IF;
END
$$;

-- Allow authenticated users to create their own profile
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM pg_policies
        WHERE schemaname = 'public'
        AND tablename = 'users'
        AND policyname = 'Users can create their own profile'
    ) THEN
        CREATE POLICY "Users can create their own profile" ON users FOR INSERT WITH CHECK (auth.uid() = id);
    END IF;
END
$$;
