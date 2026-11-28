-- GeoPop's players, saved in the family account (the same Supabase
-- project and sign-in as MathPop, PitchPop and WordPop). Each row is one player:
--   profile_key  the player's id in the app
--   name         the player's name
--   home         the player's home country (ISO code, e.g. 'US'): their
--                journey spreads out from there
--   progress     their journey: stars, passport stamps, and a spaced-
--                repetition card for each country's map spot, flag and capital
-- Row-level security limits each family account to its own players.
-- Deleting the account deletes its players (on delete cascade).
--
-- Run once in the Supabase dashboard: SQL Editor -> New query -> paste ->
-- Run. Safe to run again.

create table if not exists public.geopop_profiles (
  id bigint generated always as identity primary key,
  owner_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  profile_key text not null,
  name text not null,
  home text not null default 'US',
  progress jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (owner_id, profile_key)
);

alter table public.geopop_profiles drop constraint if exists geopop_profiles_home_check;
alter table public.geopop_profiles
  add constraint geopop_profiles_home_check check (home ~ '^[A-Z]{2}$');

alter table public.geopop_profiles enable row level security;

drop policy if exists "Families read their own GeoPop players" on public.geopop_profiles;
create policy "Families read their own GeoPop players" on public.geopop_profiles
  for select to authenticated using (owner_id = (select auth.uid()));

drop policy if exists "Families add their own GeoPop players" on public.geopop_profiles;
create policy "Families add their own GeoPop players" on public.geopop_profiles
  for insert to authenticated with check (owner_id = (select auth.uid()));

drop policy if exists "Families change their own GeoPop players" on public.geopop_profiles;
create policy "Families change their own GeoPop players" on public.geopop_profiles
  for update to authenticated using (owner_id = (select auth.uid())) with check (owner_id = (select auth.uid()));

drop policy if exists "Families remove their own GeoPop players" on public.geopop_profiles;
create policy "Families remove their own GeoPop players" on public.geopop_profiles
  for delete to authenticated using (owner_id = (select auth.uid()));

grant select, insert, update, delete on public.geopop_profiles to authenticated;
