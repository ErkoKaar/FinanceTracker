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

-- Recurring monthly expense/income templates. Auto-applied client-side each month (see
-- useApplyRecurring in src/lib/finance-data.ts) into real `expenses`/`incomes` rows.
create table if not exists public.recurring_expenses (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  description text not null,
  amount double precision not null check (amount > 0),
  category text not null,
  active boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists public.recurring_incomes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  description text not null,
  amount double precision not null check (amount > 0),
  active boolean not null default true,
  created_at timestamptz not null default now()
);

-- Marks which expense rows were auto-created from a recurring template, so applying recurring
-- items is idempotent per month. Detaches (doesn't delete) past expenses if the template is removed.
alter table public.expenses add column if not exists recurring_expense_id uuid references public.recurring_expenses(id) on delete set null;

alter table public.recurring_expenses enable row level security;
alter table public.recurring_incomes enable row level security;

drop policy if exists "recurring_expenses_all_own" on public.recurring_expenses;
create policy "recurring_expenses_all_own" on public.recurring_expenses
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "recurring_incomes_all_own" on public.recurring_incomes;
create policy "recurring_incomes_all_own" on public.recurring_incomes
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- Optional day-of-month (1-31) for when a recurring item should apply. Null means "apply as soon
-- as the new month is seen" (the original behavior); set means "wait until that day of the month".
alter table public.recurring_expenses add column if not exists day_of_month integer check (day_of_month between 1 and 31);
alter table public.recurring_incomes add column if not exists day_of_month integer check (day_of_month between 1 and 31);

-- Income becomes itemized like expenses (one row per income event) instead of one editable value
-- per month — recurring incomes just add entries the same way recurring expenses do, which avoids
-- the "syncing a single value" class of bugs entirely. Income is no longer directly editable in
-- Month/Year; individual entries are added via the Add tab and edited/deleted like expenses.
drop table if exists public.incomes cascade;

create table if not exists public.incomes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  amount double precision not null check (amount > 0),
  description text not null,
  date timestamptz not null,
  recurring_income_id uuid references public.recurring_incomes(id) on delete set null,
  created_at timestamptz not null default now()
);

alter table public.incomes enable row level security;

drop policy if exists "incomes_all_own" on public.incomes;
create policy "incomes_all_own" on public.incomes
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- Income gets its own category list (separate from expense categories — "Salary"/"Freelance"
-- don't belong in the same list as "Food"/"Transport"), mirroring the categories/expenses pattern.
create table if not exists public.income_categories (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  created_at timestamptz not null default now(),
  unique (user_id, name)
);

alter table public.income_categories enable row level security;

drop policy if exists "income_categories_all_own" on public.income_categories;
create policy "income_categories_all_own" on public.income_categories
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

alter table public.incomes add column if not exists category text not null default 'Other';
alter table public.recurring_incomes add column if not exists category text not null default 'Other';

-- Seed default income categories for new signups (extends handle_new_user) and backfill them for
-- already-signed-up users who don't have any yet.
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.categories (user_id, name)
    select new.id, c from unnest(array['Food','Transport','Housing','Entertainment','Health','Other']) as c;
  insert into public.income_categories (user_id, name)
    select new.id, c from unnest(array['Salary','Freelance','Gifts','Investments','Other']) as c;
  return new;
end;
$$ language plpgsql security definer set search_path = public;

insert into public.income_categories (user_id, name)
select u.id, c
from auth.users u
cross join unnest(array['Salary','Freelance','Gifts','Investments','Other']) as c
where not exists (select 1 from public.income_categories ic where ic.user_id = u.id);

-- Monthly spending plan per category, powers the "Plan" tab and the Planned/Remaining columns
-- on the Month view's "Expenses by category" table. One row per (user, year, month, category).
create table if not exists public.budgets (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  year integer not null,
  month integer not null check (month between 1 and 12),
  category text not null,
  amount double precision not null check (amount > 0),
  created_at timestamptz not null default now(),
  unique (user_id, year, month, category)
);

alter table public.budgets enable row level security;

drop policy if exists "budgets_all_own" on public.budgets;
create policy "budgets_all_own" on public.budgets
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- One row per device that opted in to push reminders (see src/lib/push.ts and the
-- send-reminders Edge Function, which reads this table with the service role key to bypass RLS).
create table if not exists public.push_subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  endpoint text not null unique,
  p256dh text not null,
  auth text not null,
  created_at timestamptz not null default now()
);

alter table public.push_subscriptions enable row level security;

drop policy if exists "push_subscriptions_all_own" on public.push_subscriptions;
create policy "push_subscriptions_all_own" on public.push_subscriptions
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- Run this part only AFTER deploying the send-reminders Edge Function (see its file header for
-- the deploy command). Calls it once a day; the function itself decides whether to actually send
-- anything (Sundays + last day of the month) and is a no-op every other day.
create extension if not exists pg_cron;
create extension if not exists pg_net;

select cron.schedule(
  'send-reminders-daily',
  '0 9 * * *', -- 09:00 UTC daily — adjust to taste
  $$
  select net.http_post(
    url := 'https://rsrxnwhfwmizlljktbqs.supabase.co/functions/v1/send-reminders',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'apikey', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJzcnhud2hmd21pemxsamt0YnFzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODE5NDQwNTIsImV4cCI6MjA5NzUyMDA1Mn0.qsUepTe0a2t8m6SIletV-_q2qZ-M0HNFhNMbOUDsgeU'
    )
  );
  $$
);
