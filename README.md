# FinanceTracker

A minimal, dark-themed personal finance tracker — track expenses and income by category, set monthly
budgets, automate recurring transactions, see year-over-year trends, and get nudged with a push
notification if you forget to log something. Installable as a PWA on phone or desktop.

Live: https://isiklikfinancetracker.netlify.app

## Features

- **Email/password auth** (Supabase Auth) — your data is private, scoped per account via Postgres
  Row Level Security.
- **Expenses & income**, each with their own category list (e.g. expense categories like
  *Food*/*Transport*, income categories like *Salary*/*Freelance*).
- **Recurring expenses & income** — set up once (with an optional day-of-month), and they're
  materialized into real entries automatically each month.
- **Plan / budgets** — set how much you intend to spend per category each month; the Month view
  shows Spent / Planned / Remaining side by side, with overspend highlighted.
- **Month / Year / History** views — category breakdowns (table + pie chart), a 12-month
  income/expenses/balance trend chart (with per-category drill-down) on the Year view, and a
  collapsible month-by-month or year-by-year history.
- **Push notifications** — a weekly (Sunday) and month-end reminder to log anything you forgot,
  delivered via real Web Push even when the app is closed.
- **PWA** — installable, works offline-aware (shows a clear "you're offline" screen instead of a
  broken UI when there's no connection — there's no offline data entry, everything needs the network).
- **Data export** — one-click JSON backup of everything you own, independent of Supabase's own
  backup policy.

## Tech stack

**Frontend** — Vite + React 18 + TypeScript, [TanStack Router](https://tanstack.com/router) (routing)
and [TanStack Query](https://tanstack.com/query) (data fetching/caching), Tailwind CSS v4, Recharts
(charts), lucide-react (icons). PWA via `vite-plugin-pwa` with a custom service worker
(`src/sw.ts`, Workbox `injectManifest`) to support push notifications.

**Backend** — [Supabase](https://supabase.com): Postgres (all tables behind Row Level Security —
every row is scoped to `auth.uid()`), Supabase Auth, and one Deno Edge Function
(`supabase/functions/send-reminders`) invoked daily by a `pg_cron` schedule to send the weekly/
month-end push reminders. There is no separate backend server — the client talks to Supabase
directly, authorized by RLS rather than a custom API layer.

**Hosting** — [Netlify](https://netlify.com) (frontend), Supabase (database/auth/functions).

## Project structure

```
src/
  components/        UI components, one file per concern (AddView, RecurringView, PlanView,
                      PeriodView/PeriodPanel for Month+Year, HistoryView, CategoryBreakdown,
                      TrendChart, *Row.tsx editable list rows, Dashboard shell, Login, ...)
  lib/
    supabase.ts       Supabase client
    auth.ts           useAuth() — session state, sign in/up/out
    finance-data.ts    All TanStack Query hooks: expenses, incomes, categories, recurring
                       expenses/incomes, budgets, and useApplyRecurring (the monthly automation)
    push.ts            Web Push subscribe/unsubscribe helpers
    export.ts          JSON backup export
    use-online-status.ts
  routes/             TanStack Router file-based routes (currently just "/")
  sw.ts               Custom service worker (precaching + push notification handling)
supabase/
  schema.sql          Full DB schema: tables, RLS policies, triggers, pg_cron schedule — run
                      manually in the Supabase SQL editor (see "Database setup" below)
  functions/
    send-reminders/   Edge Function that sends the weekly/month-end push notifications
netlify.toml          Build settings, SPA redirect, PWA cache headers
```

## Getting started

```bash
npm install
cp .env.example .env.local   # fill in your Supabase project URL/anon key + VAPID public key
npm run dev
```

### Environment variables (`.env.local`)

| Variable | Where to get it |
|---|---|
| `VITE_SUPABASE_URL` | Supabase dashboard → Settings → API |
| `VITE_SUPABASE_ANON_KEY` | Supabase dashboard → Settings → API (safe to expose client-side) |
| `VITE_VAPID_PUBLIC_KEY` | Generate with `npx web-push generate-vapid-keys` (see Push notifications below) |

## Database setup

Run `supabase/schema.sql` in your Supabase project's **SQL Editor**. It's idempotent (safe to
re-run) and creates every table, RLS policy, and trigger the app needs, including the default
category seed for new signups.

## Push notifications setup

Real Web Push needs a VAPID key pair and a deployed Edge Function — this is the one part of the
stack that needs the Supabase CLI, not just the SQL editor:

```bash
# Generate a key pair once; put the public half in .env.local as VITE_VAPID_PUBLIC_KEY
npx web-push generate-vapid-keys

npx supabase login
npx supabase link --project-ref <your-project-ref>
npx supabase secrets set VAPID_PUBLIC_KEY=... VAPID_PRIVATE_KEY=...
npx supabase functions deploy send-reminders --no-verify-jwt
```

Then run the `pg_cron`/`pg_net` block at the bottom of `supabase/schema.sql` (after the function is
deployed) to schedule the daily check. The function itself decides whether today is a Sunday or the
last day of the month — it's a no-op every other day.

## Scripts

| Command | What it does |
|---|---|
| `npm run dev` | Start the Vite dev server |
| `npm run build` | Type-check, build the app, and build the service worker |
| `npm run preview` | Serve the production build locally (needed to test the PWA/service worker — `dev` mode doesn't register it) |

## Deployment

Connected to Netlify via this GitHub repo (`netlify.toml` defines the build command/publish dir,
SPA fallback redirect, and cache headers for `sw.js`/`manifest.webmanifest`). Set the same three
environment variables in Netlify's site settings, and update Supabase's Auth **Site URL** /
**Redirect URLs** to your Netlify domain so email confirmation/reset links point to the right place.

## Notes on the architecture

- **No separate backend** — all business logic either lives in the client (e.g. `useApplyRecurring`,
  the recurring-transaction automation) or in Postgres/Edge Functions (RLS policies, the
  `handle_new_user` signup trigger, the reminder Edge Function). There's no Express/Next.js API
  layer; Supabase's anon key + RLS *is* the authorization model.
- **Recurring expenses/income** materialize into real `expenses`/`incomes` rows once per month
  (tracked via a `recurring_expense_id`/`recurring_income_id` column), not a separate "virtual"
  concept — so they're editable/deletable exactly like manually-entered ones afterward.
- **Budgets are monthly only** — the Year view and "History → By year" intentionally don't show
  Planned/Remaining columns, since a budget is inherently a per-month concept.
