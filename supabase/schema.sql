-- Brandkit: "brands" and "subscriptions" tables
-- Run this in the Supabase SQL editor (or via `supabase db push` / a migration)
-- for your project. Requires email auth (magic link) to be enabled under
-- Authentication > Providers > Email in the Supabase dashboard.

create table if not exists public.brands (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  business_name text,
  input jsonb not null,
  kit jsonb not null,
  logos jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists brands_user_id_created_at_idx
  on public.brands (user_id, created_at desc);

alter table public.brands enable row level security;

create policy "Users can view their own brands"
  on public.brands for select
  to authenticated
  using (auth.uid() = user_id);

create policy "Users can insert their own brands"
  on public.brands for insert
  to authenticated
  with check (auth.uid() = user_id);

create policy "Users can delete their own brands"
  on public.brands for delete
  to authenticated
  using (auth.uid() = user_id);

-- Billing: "subscriptions" table + free-plan enforcement
-- One row per user who has ever started a checkout. Written only by the
-- Stripe webhook (app/api/stripe/webhook/route.ts) via the Supabase service
-- role key, which bypasses RLS — there is deliberately no insert/update
-- policy for the `authenticated` role, so a user can never set their own
-- plan to "active" directly.

create table if not exists public.subscriptions (
  user_id uuid primary key references auth.users (id) on delete cascade,
  stripe_customer_id text unique,
  stripe_subscription_id text unique,
  status text not null default 'free',
  price_id text,
  current_period_end timestamptz,
  updated_at timestamptz not null default now()
);

alter table public.subscriptions enable row level security;

create policy "Users can view their own subscription"
  on public.subscriptions for select
  to authenticated
  using (auth.uid() = user_id);

-- True for an active or trialing Stripe subscription. security definer so it
-- can be called from the trigger below regardless of the inserting role.
create or replace function public.is_pro(uid uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.subscriptions
    where user_id = uid and status in ('active', 'trialing')
  );
$$;

-- Free plan is limited to 1 saved brand kit. Enforced here (not just in the
-- app) so it holds no matter which client performs the insert.
create or replace function public.enforce_free_brand_limit()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  existing_count integer;
begin
  if public.is_pro(new.user_id) then
    return new;
  end if;

  select count(*) into existing_count from public.brands where user_id = new.user_id;

  if existing_count >= 1 then
    raise exception 'FREE_PLAN_LIMIT_REACHED: the free plan is limited to 1 saved brand kit — upgrade to save more'
      using errcode = 'P0001';
  end if;

  return new;
end;
$$;

drop trigger if exists brands_enforce_free_limit on public.brands;
create trigger brands_enforce_free_limit
  before insert on public.brands
  for each row
  execute function public.enforce_free_brand_limit();
