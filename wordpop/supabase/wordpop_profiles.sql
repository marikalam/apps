-- WordPop's players, saved in the family account (the same Supabase
-- project and sign-in as MathPop and PitchPop). Each row is one player:
--   profile_key  the player's id in the app
--   name         the player's name
--   grade        'p' (Toddler), 'k', '1', '2', '3' or '4'
--   progress     what they've practiced: rounds, stars, and how often each
--                word or sound was right or wrong
-- Row-level security limits each family account to its own players.
-- Deleting the account deletes its players (on delete cascade).
--
-- Run once in the Supabase dashboard: SQL Editor -> New query -> paste ->
-- Run. Safe to run again.

create table if not exists public.wordpop_profiles (
  id bigint generated always as identity primary key,
  owner_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  profile_key text not null,
  name text not null,
  grade text not null default 'k',
  progress jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (owner_id, profile_key)
);

alter table public.wordpop_profiles drop constraint if exists wordpop_profiles_grade_check;
alter table public.wordpop_profiles
  add constraint wordpop_profiles_grade_check check (grade in ('p', 'k', '1', '2', '3', '4'));

alter table public.wordpop_profiles enable row level security;

drop policy if exists "Families read their own WordPop players" on public.wordpop_profiles;
create policy "Families read their own WordPop players" on public.wordpop_profiles
  for select to authenticated using (owner_id = (select auth.uid()));

drop policy if exists "Families add their own WordPop players" on public.wordpop_profiles;
create policy "Families add their own WordPop players" on public.wordpop_profiles
  for insert to authenticated with check (owner_id = (select auth.uid()));

drop policy if exists "Families change their own WordPop players" on public.wordpop_profiles;
create policy "Families change their own WordPop players" on public.wordpop_profiles
  for update to authenticated using (owner_id = (select auth.uid())) with check (owner_id = (select auth.uid()));

drop policy if exists "Families remove their own WordPop players" on public.wordpop_profiles;
create policy "Families remove their own WordPop players" on public.wordpop_profiles
  for delete to authenticated using (owner_id = (select auth.uid()));

grant select, insert, update, delete on public.wordpop_profiles to authenticated;
