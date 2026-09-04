-- Brandkit: "brands" table
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
