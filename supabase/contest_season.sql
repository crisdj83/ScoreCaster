alter table public.contests
  add column if not exists season_length text not null default 'full';

alter table public.contests
  drop constraint if exists contests_season_length_check;

alter table public.contests
  add constraint contests_season_length_check
  check (season_length in ('full', 'half'));
