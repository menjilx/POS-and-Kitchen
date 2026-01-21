create or replace function public.save_sale_with_items(
  p_sale_id uuid,
  p_tenant_id uuid,
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
as $$
declare
  v_sale_id uuid;
  v_order_number varchar;
  v_has_customer boolean;
begin
  if p_items is null or jsonb_array_length(p_items) = 0 then
    raise exception 'No items to save';
  end if;

  select exists(
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'sales'
      and column_name = 'customer_id'
  ) into v_has_customer;

  if p_sale_id is not null then
    if v_has_customer then
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
    else
      update public.sales
      set total_amount = p_total_amount,
          payment_status = p_payment_status,
          payment_method = p_payment_method,
          payment_notes = p_payment_notes,
          payment_data = coalesce(p_payment_data, '{}'::jsonb),
          notes = p_notes,
          discount_amount = p_discount_amount,
          discount_name = p_discount_name,
          tax_amount = p_tax_amount,
          table_id = p_table_id,
          sale_type = p_sale_type
      where id = p_sale_id;
    end if;

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
    if v_has_customer then
      insert into public.sales (
        tenant_id,
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
        p_tenant_id,
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
      returning id, order_number into v_sale_id, v_order_number;
    else
      insert into public.sales (
        tenant_id,
        order_number,
        sale_type,
        table_id,
        total_amount,
        payment_status,
        payment_method,
        payment_notes,
        payment_data,
        notes,
        discount_amount,
        discount_name,
        tax_amount,
        sale_date,
        sale_time,
        created_by
      ) values (
        p_tenant_id,
        p_order_number,
        p_sale_type,
        p_table_id,
        p_total_amount,
        p_payment_status,
        p_payment_method,
        p_payment_notes,
        coalesce(p_payment_data, '{}'::jsonb),
        p_notes,
        p_discount_amount,
        p_discount_name,
        p_tax_amount,
        p_sale_date,
        p_sale_time,
        p_created_by
      )
      returning id, order_number into v_sale_id, v_order_number;
    end if;

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
