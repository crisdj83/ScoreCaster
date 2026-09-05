-- Apply in the Supabase SQL editor. Speeds up contest, ranking, and sync queries.
create index if not exists predictions_contest_match_idx
  on public.predictions (contest_id, match_id);

create index if not exists predictions_contest_user_idx
  on public.predictions (contest_id, user_id);

create index if not exists predictions_match_idx
  on public.predictions (match_id);

create index if not exists contest_members_user_idx
  on public.contest_members (user_id);

create index if not exists contest_members_contest_idx
  on public.contest_members (contest_id);
