-- Stored Premier League goal scorers from API-Football.
-- In-play: refresh about every 10 minutes.
-- Finished: confirmed once, the UTC day after kickoff, then kept forever.
-- Paste into the Supabase SQL editor.

create table if not exists public.match_scorers (
  match_id text primary key,
  af_fixture_id bigint,
  home_scorers text[] not null default '{}',
  away_scorers text[] not null default '{}',
  elapsed integer,
  match_status text,
  updated_at timestamptz not null default timezone('utc'::text, now())
);

alter table public.match_scorers enable row level security;

drop policy if exists "Authenticated can read match scorers" on public.match_scorers;
create policy "Authenticated can read match scorers"
  on public.match_scorers
  for select
  to authenticated
  using (true);

grant select on public.match_scorers to authenticated;
grant all on public.match_scorers to service_role;

notify pgrst, 'reload schema';
