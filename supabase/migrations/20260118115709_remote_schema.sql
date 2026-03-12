drop extension if exists "pg_net";

drop trigger if exists "trigger_update_menu_cost_from_recipe" on "public"."recipe_items";

drop function if exists "public"."update_menu_cost_on_recipe_change"();


  create table "public"."cost_profiles" (
    "id" uuid not null default extensions.uuid_generate_v4(),
    "name" text default 'Default'::text,
    "labor_cost_per_hour" numeric default 0,
    "default_overhead_percent" numeric default 0,
    "created_at" timestamp with time zone not null default timezone('utc'::text, now())
      );


alter table "public"."cost_profiles" enable row level security;


  create table "public"."profiles" (
    "id" uuid not null,
    "email" text,
    "full_name" text,
    "role" text default 'staff'::text,
    "created_at" timestamp with time zone not null default timezone('utc'::text, now())
      );


alter table "public"."profiles" enable row level security;


  create table "public"."recipe_ingredients" (
    "id" uuid not null default extensions.uuid_generate_v4(),
    "recipe_id" uuid not null,
    "ingredient_id" uuid not null,
    "quantity" numeric not null,
    "created_at" timestamp with time zone not null default timezone('utc'::text, now())
      );


alter table "public"."recipe_ingredients" enable row level security;


  create table "public"."recipes" (
    "id" uuid not null default extensions.uuid_generate_v4(),
    "name" text not null,
    "category" text,
    "description" text,
    "target_portions" numeric default 1,
    "selling_price" numeric default 0,
    "status" text default 'draft'::text,
    "created_at" timestamp with time zone not null default timezone('utc'::text, now()),
    "updated_at" timestamp with time zone not null default timezone('utc'::text, now())
      );


alter table "public"."recipes" enable row level security;

alter table "public"."system_settings" enable row level security;

CREATE UNIQUE INDEX cost_profiles_pkey ON public.cost_profiles USING btree (id);

CREATE UNIQUE INDEX profiles_pkey ON public.profiles USING btree (id);

CREATE UNIQUE INDEX recipe_ingredients_pkey ON public.recipe_ingredients USING btree (id);

CREATE UNIQUE INDEX recipes_pkey ON public.recipes USING btree (id);

alter table "public"."cost_profiles" add constraint "cost_profiles_pkey" PRIMARY KEY using index "cost_profiles_pkey";

alter table "public"."profiles" add constraint "profiles_pkey" PRIMARY KEY using index "profiles_pkey";

alter table "public"."recipe_ingredients" add constraint "recipe_ingredients_pkey" PRIMARY KEY using index "recipe_ingredients_pkey";

alter table "public"."recipes" add constraint "recipes_pkey" PRIMARY KEY using index "recipes_pkey";

alter table "public"."profiles" add constraint "profiles_id_fkey" FOREIGN KEY (id) REFERENCES auth.users(id) ON DELETE CASCADE not valid;

alter table "public"."profiles" validate constraint "profiles_id_fkey";

alter table "public"."recipe_ingredients" add constraint "recipe_ingredients_recipe_id_fkey" FOREIGN KEY (recipe_id) REFERENCES public.recipes(id) ON DELETE CASCADE not valid;

alter table "public"."recipe_ingredients" validate constraint "recipe_ingredients_recipe_id_fkey";

set check_function_bodies = off;

CREATE OR REPLACE FUNCTION public.get_ingredient_cost_trends(p_tenant_id uuid, p_start_date date DEFAULT NULL::date, p_end_date date DEFAULT NULL::date)
 RETURNS TABLE(ingredient_id uuid, ingredient_name character varying, unit character varying, avg_cost_per_unit numeric, total_purchased numeric, last_cost_per_unit numeric, cost_change_percentage numeric)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_start_date DATE := COALESCE(p_start_date, CURRENT_DATE - INTERVAL '30 days');
  v_end_date DATE := COALESCE(p_end_date, CURRENT_DATE);
  v_user_tenant UUID;
BEGIN
  -- Verify user access
  SELECT tenant_id INTO v_user_tenant
  FROM users
  WHERE id = auth.uid();

  IF v_user_tenant IS NULL OR v_user_tenant != p_tenant_id THEN
    RAISE EXCEPTION 'Access denied';
  END IF;

  RETURN QUERY
  WITH purchase_data AS (
    SELECT 
      pi.ingredient_id,
      pi.unit_price,
      pi.quantity
    FROM purchase_items pi
    JOIN purchases p ON pi.purchase_id = p.id
    WHERE p.tenant_id = p_tenant_id
    AND p.invoice_date BETWEEN v_start_date AND v_end_date
  ),
  ingredient_stats AS (
    SELECT 
        pd.ingredient_id,
        SUM(pd.quantity) as total_qty,
        SUM(pd.quantity * pd.unit_price) as total_cost
    FROM purchase_data pd
    GROUP BY pd.ingredient_id
  ),
  ingredient_data AS (
    SELECT 
      i.id,
      i.name,
      i.unit,
      i.cost_per_unit AS current_cost
    FROM ingredients i
    WHERE i.tenant_id = p_tenant_id
  )
  SELECT 
    id.id AS ingredient_id,
    id.name AS ingredient_name,
    id.unit AS unit,
    CAST(COALESCE(
        CASE WHEN ps.total_qty > 0 THEN ps.total_cost / ps.total_qty ELSE id.current_cost END, 
        id.current_cost
    ) AS DECIMAL) AS avg_cost_per_unit,
    CAST(COALESCE(ps.total_qty, 0) AS DECIMAL) AS total_purchased,
    id.current_cost AS last_cost_per_unit,
    CAST(CASE 
      WHEN COALESCE(
          CASE WHEN ps.total_qty > 0 THEN ps.total_cost / ps.total_qty ELSE id.current_cost END, 
          id.current_cost
      ) > 0 
      THEN (
          (id.current_cost - COALESCE(
              CASE WHEN ps.total_qty > 0 THEN ps.total_cost / ps.total_qty ELSE id.current_cost END, 
              id.current_cost
          )) 
          / 
          COALESCE(
              CASE WHEN ps.total_qty > 0 THEN ps.total_cost / ps.total_qty ELSE id.current_cost END, 
              id.current_cost
          )
      ) * 100
      ELSE 0
    END AS DECIMAL) AS cost_change_percentage
  FROM ingredient_data id
  LEFT JOIN ingredient_stats ps ON id.id = ps.ingredient_id
  ORDER BY cost_change_percentage DESC;
END;
$function$
;

grant delete on table "public"."cost_profiles" to "anon";

grant insert on table "public"."cost_profiles" to "anon";

grant references on table "public"."cost_profiles" to "anon";

grant select on table "public"."cost_profiles" to "anon";

grant trigger on table "public"."cost_profiles" to "anon";

grant truncate on table "public"."cost_profiles" to "anon";

grant update on table "public"."cost_profiles" to "anon";

grant delete on table "public"."cost_profiles" to "authenticated";

grant insert on table "public"."cost_profiles" to "authenticated";

grant references on table "public"."cost_profiles" to "authenticated";

grant select on table "public"."cost_profiles" to "authenticated";

grant trigger on table "public"."cost_profiles" to "authenticated";

grant truncate on table "public"."cost_profiles" to "authenticated";

grant update on table "public"."cost_profiles" to "authenticated";

grant delete on table "public"."cost_profiles" to "service_role";

grant insert on table "public"."cost_profiles" to "service_role";

grant references on table "public"."cost_profiles" to "service_role";

grant select on table "public"."cost_profiles" to "service_role";

grant trigger on table "public"."cost_profiles" to "service_role";

grant truncate on table "public"."cost_profiles" to "service_role";

grant update on table "public"."cost_profiles" to "service_role";

grant delete on table "public"."profiles" to "anon";

grant insert on table "public"."profiles" to "anon";

grant references on table "public"."profiles" to "anon";

grant select on table "public"."profiles" to "anon";

grant trigger on table "public"."profiles" to "anon";

grant truncate on table "public"."profiles" to "anon";

grant update on table "public"."profiles" to "anon";

grant delete on table "public"."profiles" to "authenticated";

grant insert on table "public"."profiles" to "authenticated";

grant references on table "public"."profiles" to "authenticated";

grant select on table "public"."profiles" to "authenticated";

grant trigger on table "public"."profiles" to "authenticated";

grant truncate on table "public"."profiles" to "authenticated";

grant update on table "public"."profiles" to "authenticated";

grant delete on table "public"."profiles" to "service_role";

grant insert on table "public"."profiles" to "service_role";

grant references on table "public"."profiles" to "service_role";

grant select on table "public"."profiles" to "service_role";

grant trigger on table "public"."profiles" to "service_role";

grant truncate on table "public"."profiles" to "service_role";

grant update on table "public"."profiles" to "service_role";

grant delete on table "public"."recipe_ingredients" to "anon";

grant insert on table "public"."recipe_ingredients" to "anon";

grant references on table "public"."recipe_ingredients" to "anon";

grant select on table "public"."recipe_ingredients" to "anon";

grant trigger on table "public"."recipe_ingredients" to "anon";

grant truncate on table "public"."recipe_ingredients" to "anon";

grant update on table "public"."recipe_ingredients" to "anon";

grant delete on table "public"."recipe_ingredients" to "authenticated";

grant insert on table "public"."recipe_ingredients" to "authenticated";

grant references on table "public"."recipe_ingredients" to "authenticated";

grant select on table "public"."recipe_ingredients" to "authenticated";

grant trigger on table "public"."recipe_ingredients" to "authenticated";

grant truncate on table "public"."recipe_ingredients" to "authenticated";

grant update on table "public"."recipe_ingredients" to "authenticated";

grant delete on table "public"."recipe_ingredients" to "service_role";

grant insert on table "public"."recipe_ingredients" to "service_role";

grant references on table "public"."recipe_ingredients" to "service_role";

grant select on table "public"."recipe_ingredients" to "service_role";

grant trigger on table "public"."recipe_ingredients" to "service_role";

grant truncate on table "public"."recipe_ingredients" to "service_role";

grant update on table "public"."recipe_ingredients" to "service_role";

grant delete on table "public"."recipes" to "anon";

grant insert on table "public"."recipes" to "anon";

grant references on table "public"."recipes" to "anon";

grant select on table "public"."recipes" to "anon";

grant trigger on table "public"."recipes" to "anon";

grant truncate on table "public"."recipes" to "anon";

grant update on table "public"."recipes" to "anon";

grant delete on table "public"."recipes" to "authenticated";

grant insert on table "public"."recipes" to "authenticated";

grant references on table "public"."recipes" to "authenticated";

grant select on table "public"."recipes" to "authenticated";

grant trigger on table "public"."recipes" to "authenticated";

grant truncate on table "public"."recipes" to "authenticated";

grant update on table "public"."recipes" to "authenticated";

grant delete on table "public"."recipes" to "service_role";

grant insert on table "public"."recipes" to "service_role";

grant references on table "public"."recipes" to "service_role";

grant select on table "public"."recipes" to "service_role";

grant trigger on table "public"."recipes" to "service_role";

grant truncate on table "public"."recipes" to "service_role";

grant update on table "public"."recipes" to "service_role";


  create policy "Allow all actions for authenticated users"
  on "public"."cost_profiles"
  as permissive
  for all
  to public
using ((auth.role() = 'authenticated'::text));



  create policy "Allow all actions for authenticated users"
  on "public"."profiles"
  as permissive
  for all
  to public
using ((auth.role() = 'authenticated'::text));



  create policy "Allow all actions for authenticated users"
  on "public"."recipe_ingredients"
  as permissive
  for all
  to public
using ((auth.role() = 'authenticated'::text));



  create policy "Allow all actions for authenticated users"
  on "public"."recipes"
  as permissive
  for all
  to public
using ((auth.role() = 'authenticated'::text));



