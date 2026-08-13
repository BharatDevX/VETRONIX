drop table if exists public.doctor_meeting_outcome_products cascade;
drop table if exists public.doctor_meeting_outcomes cascade;
drop table if exists public.dealer_meeting_outcomes cascade;

alter table public.doctor_meeting_plans
  drop column if exists meeting_date,
  drop column if exists agreed_percentage,
  add column if not exists reply text;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'doctor_meeting_plans_reply_max_length_check'
      and conrelid = 'public.doctor_meeting_plans'::regclass
  ) then
    alter table public.doctor_meeting_plans
      add constraint doctor_meeting_plans_reply_max_length_check
      check (reply is null or char_length(reply) <= 1000)
      not valid;
  end if;
end
$$;

alter table public.sales
  add column if not exists retailer_id uuid;

do $$
begin
  if to_regclass('public.retailers') is not null
    and not exists (
      select 1
      from pg_constraint
      where conname = 'sales_retailer_id_fkey'
        and conrelid = 'public.sales'::regclass
    )
  then
    alter table public.sales
      add constraint sales_retailer_id_fkey
      foreign key (retailer_id)
      references public.retailers(id)
      on delete set null
      not valid;
  end if;
end
$$;

alter table public.sales
  drop constraint if exists sales_sale_type_doctor_check;

alter table public.sales
  add constraint sales_sale_type_order_form_check
  check (
    sale_type in ('counter', 'doctor', 'retailer', 'farmer')
    and (
      (sale_type = 'doctor' and doctor_id is not null)
      or
      (sale_type <> 'doctor' and doctor_id is null)
    )
    and (
      sale_type = 'doctor'
      or
      (sale_type = 'retailer' and retailer_id is not null)
      or
      (sale_type in ('counter', 'farmer') and retailer_id is null)
    )
  )
  not valid;

drop index if exists public.sales_doctor_employee_dealer_doctor_product_date_key;
drop index if exists public.sales_doctor_employee_dealer_doctor_retailer_product_date_key;
drop index if exists public.sales_doctor_employee_dealer_doctor_product_date_no_retailer_key;
drop index if exists public.sales_retailer_employee_dealer_retailer_product_date_key;
drop index if exists public.sales_farmer_employee_dealer_product_date_key;

create unique index if not exists sales_doctor_employee_dealer_doctor_retailer_product_date_key
on public.sales (employee_id, sale_type, dealer_id, doctor_id, retailer_id, product_id, sale_date)
where sale_type = 'doctor' and doctor_id is not null and retailer_id is not null;

create unique index if not exists sales_doctor_employee_dealer_doctor_product_date_no_retailer_key
on public.sales (employee_id, sale_type, dealer_id, doctor_id, product_id, sale_date)
where sale_type = 'doctor' and doctor_id is not null and retailer_id is null;

create unique index if not exists sales_retailer_employee_dealer_retailer_product_date_key
on public.sales (employee_id, sale_type, dealer_id, retailer_id, product_id, sale_date)
where sale_type = 'retailer' and doctor_id is null and retailer_id is not null;

create unique index if not exists sales_farmer_employee_dealer_product_date_key
on public.sales (employee_id, sale_type, dealer_id, product_id, sale_date)
where sale_type = 'farmer' and doctor_id is null and retailer_id is null;
