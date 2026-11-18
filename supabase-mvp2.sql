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


-- -----------------------------------------------------------------------------
-- Articles Table (SEO Content Generation)
-- -----------------------------------------------------------------------------
create table if not exists public.articles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade,
  keyword text,
  mode text,
  mode_name text,
  language text,
  seo_title text not null,
  meta_description text,
  slug text,
  article_html text not null,
  word_count integer default 0,
  keyword_density_percent numeric default 0,
  og_tags jsonb default '{}'::jsonb,
  schema jsonb default '{}'::jsonb,
  table_of_contents jsonb default '[]'::jsonb,
  lsi_keywords jsonb default '[]'::jsonb,
  images jsonb default '[]'::jsonb,
  internal_link_placeholders jsonb default '[]'::jsonb,
  external_link_placeholders jsonb default '[]'::jsonb,
  seo_audit jsonb default '{}'::jsonb,
  mode_audit jsonb,
  generation_settings jsonb,
  status text default 'draft',
  created_at timestamptz not null default now()
);

-- Ensure user_id column exists if table was created previously without it
alter table public.articles add column if not exists user_id uuid references auth.users(id) on delete cascade;

create index if not exists articles_user_created_idx
  on public.articles (user_id, created_at desc);

alter table public.articles enable row level security;

drop policy if exists "Users can manage their own articles" on public.articles;
create policy "Users can manage their own articles"
  on public.articles
  for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);
