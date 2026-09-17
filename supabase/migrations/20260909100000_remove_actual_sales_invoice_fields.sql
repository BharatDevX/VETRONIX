alter table if exists public.actual_sales
  drop column if exists invoice_no,
  drop column if exists credit_period,
  drop column if exists due_date;
