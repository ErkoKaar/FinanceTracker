-- Database schema for the FinanceTracker app: incomes/categories/expenses tables, RLS policies
-- scoping every row to auth.uid(), and a trigger that seeds default categories for each new user.
-- Run this in the Supabase dashboard SQL editor (Project > SQL Editor).

-- Replaces the old single global "profiles.income" value with per-month income rows, so a year's
-- income is just the sum of that year's months instead of a separately editable number.
drop table if exists public.profiles cascade;

create table if not exists public.incomes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  year integer not null,
  month integer not null check (month between 1 and 12),
  amount double precision not null default 0 check (amount >= 0),
  created_at timestamptz not null default now(),
  unique (user_id, year, month)
);

create table if not exists public.categories (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  created_at timestamptz not null default now(),
  unique (user_id, name)
);

create table if not exists public.expenses (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  amount double precision not null check (amount > 0),
  description text not null,
  category text not null,
  date timestamptz not null,
  created_at timestamptz not null default now()
);

alter table public.incomes enable row level security;
alter table public.categories enable row level security;
alter table public.expenses enable row level security;

drop policy if exists "incomes_all_own" on public.incomes;
create policy "incomes_all_own" on public.incomes
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "categories_all_own" on public.categories;
create policy "categories_all_own" on public.categories
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "expenses_all_own" on public.expenses;
create policy "expenses_all_own" on public.expenses
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- Seed default categories whenever a new auth user is created.
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.categories (user_id, name)
    select new.id, c from unnest(array['Food','Transport','Housing','Entertainment','Health','Other']) as c;
  return new;
end;
$$ language plpgsql security definer set search_path = public;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- One-off rename of the old Estonian default category names to English for already-signed-up
-- users (the app's UI/data is now English-only). Safe to re-run: matches nothing once renamed.
update public.categories set name = 'Food' where name = 'Toit';
update public.categories set name = 'Housing' where name = 'Eluase';
update public.categories set name = 'Entertainment' where name = 'Meelelahutus';
update public.categories set name = 'Health' where name = 'Tervis';
update public.categories set name = 'Other' where name = 'Muu';

update public.expenses set category = 'Food' where category = 'Toit';
update public.expenses set category = 'Housing' where category = 'Eluase';
update public.expenses set category = 'Entertainment' where category = 'Meelelahutus';
update public.expenses set category = 'Health' where category = 'Tervis';
update public.expenses set category = 'Other' where category = 'Muu';
