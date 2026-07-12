-- ============================================
-- GrowthPilot Admin Panel — system_config table
-- Run this SQL in your Supabase SQL Editor
-- ============================================

-- Create the system_config table
create table if not exists public.system_config (
  key text primary key,
  value text not null,
  updated_at timestamptz not null default now()
);

-- Insert default values
insert into public.system_config (key, value) values
  ('trial_seo_word_limit', '5000'),
  ('trial_keyword_limit', '3'),
  ('trial_marketing_limit', '3')
on conflict (key) do nothing;

-- Enable Row Level Security
alter table public.system_config enable row level security;

-- Allow anyone to READ config (needed for workspace pages with anon key)
drop policy if exists "Public read system config" on public.system_config;
create policy "Public read system config"
  on public.system_config
  for select
  using (true);

-- Only service role can WRITE (admin panel uses service role key)
-- No insert/update/delete policy needed for anon — service role bypasses RLS
