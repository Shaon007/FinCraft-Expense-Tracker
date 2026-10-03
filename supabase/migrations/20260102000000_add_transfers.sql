-- Transfer / Inter-account movement schema
-- Run this in Supabase SQL Editor after the init schema

create table if not exists public.account_transfers (
  id              uuid primary key default uuid_generate_v4(),
  user_id         uuid not null references public.profiles(id) on delete cascade,
  from_account_id uuid references public.deposits(id) on delete set null,
  to_account_id   uuid references public.deposits(id) on delete set null,
  amount          numeric(12,2) not null check (amount > 0),
  note            text,
  date            date not null default current_date,
  currency        text not null default 'BDT',
  created_at      timestamptz not null default now()
);

create index idx_transfers_user on public.account_transfers(user_id, date desc);
alter table public.account_transfers enable row level security;
create policy "Users manage own transfers"
  on public.account_transfers for all using (auth.uid() = user_id);

-- Function to perform atomic transfer
create or replace function public.perform_transfer(
  p_user_id       uuid,
  p_from_id       uuid,
  p_to_id         uuid,
  p_amount        numeric,
  p_note          text,
  p_date          date,
  p_currency      text
) returns uuid language plpgsql security definer as $$
declare
  v_transfer_id uuid;
begin
  -- Deduct from source account
  update public.deposits
    set balance = balance - p_amount, updated_at = now()
    where id = p_from_id and user_id = p_user_id;

  -- Add to destination account
  update public.deposits
    set balance = balance + p_amount, updated_at = now()
    where id = p_to_id and user_id = p_user_id;

  -- Record the transfer
  insert into public.account_transfers(user_id, from_account_id, to_account_id, amount, note, date, currency)
    values (p_user_id, p_from_id, p_to_id, p_amount, p_note, p_date, p_currency)
    returning id into v_transfer_id;

  return v_transfer_id;
end; $$;
