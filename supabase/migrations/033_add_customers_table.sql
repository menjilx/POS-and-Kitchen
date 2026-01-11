create table if not exists public.customers (
  id uuid not null default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id),
  name text not null,
  email text,
  phone text,
  address text,
  notes text,
  is_active boolean default true,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null,
  
  constraint customers_pkey primary key (id)
);

alter table public.customers enable row level security;

create policy "Users can view customers of their tenant"
on public.customers for select
using (tenant_id in (
  select tenant_id from public.users where id = auth.uid()
));

create policy "Users can insert customers for their tenant"
on public.customers for insert
with check (tenant_id in (
  select tenant_id from public.users where id = auth.uid()
));

create policy "Users can update customers of their tenant"
on public.customers for update
using (tenant_id in (
  select tenant_id from public.users where id = auth.uid()
));

-- Add customer_id to sales table
alter table public.sales 
add column if not exists customer_id uuid references public.customers(id);

-- Create index for performance
create index if not exists idx_customers_tenant_id on public.customers(tenant_id);
create index if not exists idx_sales_customer_id on public.sales(customer_id);
