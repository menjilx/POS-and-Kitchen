-- Fix hold order bug: make save_sale_with_items SECURITY DEFINER
-- so staff users can update sales through the RPC, and add
-- an explicit UPDATE policy for staff on the sales table.

BEGIN;

-- 1. Recreate save_sale_with_items as SECURITY DEFINER
--    This bypasses RLS so staff can update held orders via the RPC.
CREATE OR REPLACE FUNCTION save_sale_with_items(
  p_sale_id uuid,
  p_order_number varchar,
  p_sale_type varchar,
  p_table_id uuid,
  p_total_amount numeric,
  p_payment_status varchar,
  p_payment_method varchar,
  p_payment_notes text,
  p_payment_data jsonb,
  p_notes text,
  p_customer_id uuid,
  p_discount_amount numeric,
  p_discount_name text,
  p_tax_amount numeric,
  p_sale_date date,
  p_sale_time timestamptz,
  p_created_by uuid,
  p_items jsonb
)
returns table (sale_id uuid, order_number varchar)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_sale_id uuid;
  v_order_number varchar;
begin
  if p_items is null or jsonb_array_length(p_items) = 0 then
    raise exception 'No items to save';
  end if;

  if p_sale_id is not null then
    update public.sales
    set total_amount = p_total_amount,
        payment_status = p_payment_status,
        payment_method = p_payment_method,
        payment_notes = p_payment_notes,
        payment_data = coalesce(p_payment_data, '{}'::jsonb),
        notes = p_notes,
        customer_id = p_customer_id,
        discount_amount = p_discount_amount,
        discount_name = p_discount_name,
        tax_amount = p_tax_amount,
        table_id = p_table_id,
        sale_type = p_sale_type
    where id = p_sale_id;

    delete from public.sale_items where sale_id = p_sale_id;

    insert into public.sale_items (sale_id, menu_item_id, quantity, unit_price, total_price, notes)
    select
      p_sale_id,
      (item->>'menu_item_id')::uuid,
      coalesce((item->>'quantity')::int, 0),
      coalesce((item->>'unit_price')::numeric, 0),
      coalesce(
        (item->>'total_price')::numeric,
        coalesce((item->>'unit_price')::numeric, 0) * coalesce((item->>'quantity')::numeric, 0)
      ),
      item->>'notes'
    from jsonb_array_elements(p_items) as item;

    select s.order_number into v_order_number
    from public.sales s
    where s.id = p_sale_id;

    return query select p_sale_id, v_order_number;
  else
    insert into public.sales as s (
      order_number,
      sale_type,
      table_id,
      total_amount,
      payment_status,
      payment_method,
      payment_notes,
      payment_data,
      notes,
      customer_id,
      discount_amount,
      discount_name,
      tax_amount,
      sale_date,
      sale_time,
      created_by
    ) values (
      p_order_number,
      p_sale_type,
      p_table_id,
      p_total_amount,
      p_payment_status,
      p_payment_method,
      p_payment_notes,
      coalesce(p_payment_data, '{}'::jsonb),
      p_notes,
      p_customer_id,
      p_discount_amount,
      p_discount_name,
      p_tax_amount,
      p_sale_date,
      p_sale_time,
      p_created_by
    )
    returning s.id, s.order_number into v_sale_id, v_order_number;

    insert into public.sale_items (sale_id, menu_item_id, quantity, unit_price, total_price, notes)
    select
      v_sale_id,
      (item->>'menu_item_id')::uuid,
      coalesce((item->>'quantity')::int, 0),
      coalesce((item->>'unit_price')::numeric, 0),
      coalesce(
        (item->>'total_price')::numeric,
        coalesce((item->>'unit_price')::numeric, 0) * coalesce((item->>'quantity')::numeric, 0)
      ),
      item->>'notes'
    from jsonb_array_elements(p_items) as item;

    return query select v_sale_id, v_order_number;
  end if;
end;
$$;

-- 2. Add RLS policy allowing staff to update sales
--    (staff previously only had INSERT, causing held order updates to fail)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'sales' AND policyname = 'Staff can update sales'
  ) THEN
    CREATE POLICY "Staff can update sales" ON public.sales
      FOR UPDATE
      USING (
        EXISTS (
          SELECT 1 FROM public.profiles
          WHERE profiles.id = auth.uid()
            AND profiles.role IN ('owner', 'manager', 'staff')
        )
      )
      WITH CHECK (
        EXISTS (
          SELECT 1 FROM public.profiles
          WHERE profiles.id = auth.uid()
            AND profiles.role IN ('owner', 'manager', 'staff')
        )
      );
  END IF;
END $$;

COMMIT;
