-- Add unique constraint to avoid duplicates
ALTER TABLE public.customers ADD CONSTRAINT customers_tenant_id_name_key UNIQUE (tenant_id, name);

-- Function to create default walk-in customer for a tenant
CREATE OR REPLACE FUNCTION public.create_default_walkin_customer()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.customers (tenant_id, name, is_active, notes)
  VALUES (NEW.id, 'Walk-in', true, 'Default customer for walk-in sales')
  ON CONFLICT (tenant_id, name) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to create walk-in customer when a new tenant is created
DROP TRIGGER IF EXISTS trigger_create_default_walkin_customer ON public.tenants;
CREATE TRIGGER trigger_create_default_walkin_customer
  AFTER INSERT ON public.tenants
  FOR EACH ROW
  EXECUTE FUNCTION public.create_default_walkin_customer();

-- Insert for existing tenants
INSERT INTO public.customers (tenant_id, name, is_active, notes)
SELECT id, 'Walk-in', true, 'Default customer for walk-in sales'
FROM public.tenants
ON CONFLICT (tenant_id, name) DO NOTHING;
