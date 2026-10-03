-- Migration: Add DPS (Deposit Pension Scheme) support and columns to deposits table
-- Run in Supabase SQL Editor if you are using Supabase

-- 1. Update account_type constraint to allow 'dps' and 'cash'
alter table public.deposits drop constraint if exists deposits_account_type_check;
alter table public.deposits add constraint deposits_account_type_check 
  check (account_type in ('savings', 'checking', 'fd', 'mfs', 'investment', 'dps', 'cash'));

-- 2. Add DPS installment and automation columns
alter table public.deposits add column if not exists monthly_deposit numeric(12,2) default 0;
alter table public.deposits add column if not exists deposit_day int default 5;
alter table public.deposits add column if not exists source_account_id uuid references public.deposits(id) on delete set null;
alter table public.deposits add column if not exists source_account_name text;
alter table public.deposits add column if not exists last_auto_debit_month text;
alter table public.deposits add column if not exists tenure_years numeric(4,1);
