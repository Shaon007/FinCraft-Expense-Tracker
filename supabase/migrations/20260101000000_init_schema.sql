-- FinCraft Database Schema
-- Run in Supabase SQL Editor

-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- ============================================================
-- PROFILES
-- ============================================================
create table if not exists public.profiles (
  id           uuid primary key references auth.users(id) on delete cascade,
  display_name text,
  avatar_url   text,
  currency     text not null default 'USD',
  monthly_budget numeric(12,2) default 0,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);
alter table public.profiles enable row level security;
create policy "Users manage own profile"
  on public.profiles for all using (auth.uid() = id);

-- ============================================================
-- EXPENSE CATEGORIES
-- ============================================================
create table if not exists public.categories (
  id         uuid primary key default uuid_generate_v4(),
  user_id    uuid references public.profiles(id) on delete cascade,
  name       text not null,
  icon       text not null default '💰',
  color      text not null default '#7C3AED',
  is_default boolean not null default false,
  created_at timestamptz not null default now()
);
alter table public.categories enable row level security;
create policy "Users manage own categories"
  on public.categories for all using (auth.uid() = user_id);

-- Seed default categories (shared, no user_id)
insert into public.categories (id, user_id, name, icon, color, is_default) values
  (uuid_generate_v4(), null, 'Food & Dining',     '🍔', '#F59E0B', true),
  (uuid_generate_v4(), null, 'Transportation',     '🚗', '#3B82F6', true),
  (uuid_generate_v4(), null, 'Shopping',           '🛍️', '#EC4899', true),
  (uuid_generate_v4(), null, 'Housing',            '🏠', '#8B5CF6', true),
  (uuid_generate_v4(), null, 'Entertainment',      '🎬', '#06B6D4', true),
  (uuid_generate_v4(), null, 'Health & Fitness',   '💊', '#10B981', true),
  (uuid_generate_v4(), null, 'Education',          '📚', '#F97316', true),
  (uuid_generate_v4(), null, 'Travel',             '✈️', '#6366F1', true),
  (uuid_generate_v4(), null, 'Subscriptions',      '📱', '#84CC16', true),
  (uuid_generate_v4(), null, 'Utilities',          '⚡', '#EF4444', true),
  (uuid_generate_v4(), null, 'Personal Care',      '💆', '#A78BFA', true),
  (uuid_generate_v4(), null, 'Other',              '📦', '#6B7280', true)
on conflict do nothing;

-- ============================================================
-- TRANSACTIONS (expenses & income)
-- ============================================================
create table if not exists public.transactions (
  id          uuid primary key default uuid_generate_v4(),
  user_id     uuid not null references public.profiles(id) on delete cascade,
  type        text not null check (type in ('expense', 'income')),
  amount      numeric(12,2) not null check (amount > 0),
  category_id uuid references public.categories(id),
  description text,
  note        text,
  date        date not null default current_date,
  currency    text not null default 'USD',
  tags        text[] default '{}',
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);
create index idx_transactions_user_date on public.transactions(user_id, date desc);
create index idx_transactions_user_type on public.transactions(user_id, type);
alter table public.transactions enable row level security;
create policy "Users manage own transactions"
  on public.transactions for all using (auth.uid() = user_id);

-- ============================================================
-- DEBTS
-- ============================================================
create table if not exists public.debts (
  id             uuid primary key default uuid_generate_v4(),
  user_id        uuid not null references public.profiles(id) on delete cascade,
  label          text not null,
  debtor_name    text not null,
  direction      text not null check (direction in ('owe', 'owed')),
  principal      numeric(12,2) not null check (principal > 0),
  remaining      numeric(12,2) not null check (remaining >= 0),
  interest_rate  numeric(5,2) default 0,
  due_date       date,
  status         text not null default 'active' check (status in ('active', 'paid', 'overdue')),
  currency       text not null default 'USD',
  notes          text,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now()
);
create index idx_debts_user on public.debts(user_id, status);
alter table public.debts enable row level security;
create policy "Users manage own debts"
  on public.debts for all using (auth.uid() = user_id);

-- ============================================================
-- BANK DEPOSITS / SAVINGS
-- ============================================================
create table if not exists public.deposits (
  id             uuid primary key default uuid_generate_v4(),
  user_id        uuid not null references public.profiles(id) on delete cascade,
  bank_name      text not null,
  account_type   text not null default 'savings' check (account_type in ('savings','checking','fd','mfs','investment')),
  balance        numeric(12,2) not null default 0,
  interest_rate  numeric(5,2) default 0,
  account_number text,
  maturity_date  date,
  currency       text not null default 'USD',
  notes          text,
  is_primary     boolean default false,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now()
);
create index idx_deposits_user on public.deposits(user_id);
alter table public.deposits enable row level security;
create policy "Users manage own deposits"
  on public.deposits for all using (auth.uid() = user_id);

-- ============================================================
-- BUDGETS (per category per month)
-- ============================================================
create table if not exists public.budgets (
  id          uuid primary key default uuid_generate_v4(),
  user_id     uuid not null references public.profiles(id) on delete cascade,
  category_id uuid references public.categories(id),
  amount      numeric(12,2) not null check (amount > 0),
  period      text not null default 'monthly' check (period in ('weekly', 'monthly', 'yearly')),
  year        int not null,
  month       int check (month between 1 and 12),
  created_at  timestamptz not null default now()
);
create unique index idx_budgets_unique on public.budgets(user_id, category_id, year, month);
alter table public.budgets enable row level security;
create policy "Users manage own budgets"
  on public.budgets for all using (auth.uid() = user_id);

-- ============================================================
-- AUTO-UPDATE updated_at TRIGGER
-- ============================================================
create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin new.updated_at = now(); return new; end; $$;

create trigger trg_profiles_updated   before update on public.profiles   for each row execute function public.set_updated_at();
create trigger trg_transactions_updated before update on public.transactions for each row execute function public.set_updated_at();
create trigger trg_debts_updated      before update on public.debts      for each row execute function public.set_updated_at();
create trigger trg_deposits_updated   before update on public.deposits   for each row execute function public.set_updated_at();

-- ============================================================
-- PROFILE AUTO-CREATE ON SIGNUP
-- ============================================================
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer as $$
begin
  insert into public.profiles(id, display_name, avatar_url)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1)),
    new.raw_user_meta_data->>'avatar_url'
  );
  return new;
end; $$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();
