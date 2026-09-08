-- Public contests: anyone can join without an invite key.
-- Safe to paste into the Supabase SQL Editor.

alter table public.contests add column if not exists is_public boolean not null default false;

create index if not exists contests_is_public_idx
  on public.contests (is_public)
  where is_public = true;
