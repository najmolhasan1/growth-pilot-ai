create table if not exists public.brand_profiles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  profile jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

create table if not exists public.marketing_assets (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  tool text not null,
  title text not null default 'Untitled asset',
  language text not null default 'English',
  inputs jsonb not null default '{}'::jsonb,
  brand_snapshot jsonb not null default '{}'::jsonb,
  result jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists marketing_assets_user_created_idx
  on public.marketing_assets (user_id, created_at desc);

alter table public.brand_profiles enable row level security;
alter table public.marketing_assets enable row level security;

drop policy if exists "Users can manage their own brand profile" on public.brand_profiles;
create policy "Users can manage their own brand profile"
  on public.brand_profiles
  for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "Users can manage their own marketing assets" on public.marketing_assets;
create policy "Users can manage their own marketing assets"
  on public.marketing_assets
  for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);
