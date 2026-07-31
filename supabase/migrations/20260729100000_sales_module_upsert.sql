update public.sales
set amount = quantity * rate
where amount is distinct from quantity * rate;

create or replace function public.set_sales_amount()
returns trigger
language plpgsql
as $$
begin
  new.amount := new.quantity * new.rate;
  return new;
end;
$$;

drop trigger if exists set_sales_amount_before_write on public.sales;

create trigger set_sales_amount_before_write
before insert or update of quantity, rate, amount
on public.sales
for each row
execute function public.set_sales_amount();

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'sales_positive_values_check'
      and conrelid = 'public.sales'::regclass
  ) then
    alter table public.sales
      add constraint sales_positive_values_check
      check (quantity > 0 and rate > 0 and amount >= 0)
      not valid;
  end if;
end
$$;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'sales_sale_type_doctor_check'
      and conrelid = 'public.sales'::regclass
  ) then
    alter table public.sales
      add constraint sales_sale_type_doctor_check
      check (
        (sale_type = 'counter' and doctor_id is null)
        or
        (sale_type = 'doctor' and doctor_id is not null)
      )
      not valid;
  end if;
end
$$;

create unique index if not exists sales_counter_employee_dealer_product_date_key
on public.sales (employee_id, sale_type, dealer_id, product_id, sale_date)
where sale_type = 'counter' and doctor_id is null;

create unique index if not exists sales_doctor_employee_dealer_doctor_product_date_key
on public.sales (employee_id, sale_type, dealer_id, doctor_id, product_id, sale_date)
where sale_type = 'doctor' and doctor_id is not null;

create unique index if not exists sales_targets_employee_month_year_key
on public.sales_targets (employee_id, month, year);
