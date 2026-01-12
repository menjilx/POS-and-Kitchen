
-- Create permissions table
CREATE TABLE IF NOT EXISTS public.role_permissions (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    tenant_id uuid REFERENCES public.tenants(id) ON DELETE CASCADE NOT NULL,
    role text NOT NULL CHECK (role IN ('owner', 'manager', 'staff')),
    permissions jsonb NOT NULL DEFAULT '[]'::jsonb,
    created_at timestamptz DEFAULT now() NOT NULL,
    updated_at timestamptz DEFAULT now() NOT NULL,
    UNIQUE(tenant_id, role)
);

-- RLS Policies
ALTER TABLE public.role_permissions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Owners can manage role permissions"
    ON public.role_permissions
    FOR ALL
    USING (
        auth.uid() IN (
            SELECT id FROM public.users 
            WHERE tenant_id = role_permissions.tenant_id 
            AND role = 'owner'
        )
    );

CREATE POLICY "Users can view role permissions"
    ON public.role_permissions
    FOR SELECT
    USING (
        auth.uid() IN (
            SELECT id FROM public.users 
            WHERE tenant_id = role_permissions.tenant_id
        )
    );
