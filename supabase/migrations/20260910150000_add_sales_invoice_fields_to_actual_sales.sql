-- Add invoice_no, credit_period, and due_date columns to actual_sales table
-- These fields are specific to actual sales invoices, not orders

alter table if exists public.actual_sales
  add column if not exists invoice_no text,
  add column if not exists credit_period integer,
  add column if not exists due_date date;
