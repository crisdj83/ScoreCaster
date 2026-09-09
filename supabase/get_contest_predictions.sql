-- Run this in the Supabase SQL editor.
--
-- get_contest_predictions(contest_id, match_ids)
-- Returns predictions for every member of a contest, scoped to the given
-- match ids, for the calling (authenticated) user only if they are a member
-- of that contest. Runs as SECURITY DEFINER so it can read across all
-- members' predictions (bypassing the per-row `predictions_select_contest_member`
-- policy, which only lets a member see their own rows) while still enforcing
-- membership as an explicit check inside the function body.
--
-- This replaces the previous app-layer pattern of falling back to the
-- service-role client (createAdminClient()) from Next.js pages just to
-- aggregate cross-member predictions for the ranking/reveal screens. Reveal
-- timing rules should still be enforced by the caller: this function returns
-- all rows for the requested match ids without applying its own "reveal
-- window" logic, since the caller passes only the match ids it wants to
-- reveal.
--
-- Types must match public.predictions (see schema.sql): match_id is bigint
-- and points is numeric (close predictions can score 1.5). A prior integer
-- signature will fail with "structure of query does not match function
-- result type" against the live table.
drop function if exists public.get_contest_predictions(uuid, integer[]);
drop function if exists public.get_contest_predictions(uuid, bigint[]);

create or replace function public.get_contest_predictions(
  p_contest_id uuid,
  p_match_ids bigint[]
)
returns table (
  user_id uuid,
  match_id bigint,
  predicted_home_score integer,
  predicted_away_score integer,
  points numeric,
  is_exact boolean,
  is_correct boolean
)
language plpgsql
security definer
set search_path = public
as $$
begin
  if not exists (
    select 1 from public.contest_members m
    where m.contest_id = p_contest_id
      and m.user_id = auth.uid()
  ) then
    raise exception 'Not a member of this contest';
  end if;

  return query
  select
    p.user_id,
    p.match_id,
    p.predicted_home_score,
    p.predicted_away_score,
    p.points,
    p.is_exact,
    p.is_correct
  from public.predictions p
  where p.contest_id = p_contest_id
    and (p_match_ids is null or p.match_id = any(p_match_ids));
end;
$$;

revoke all on function public.get_contest_predictions(uuid, bigint[]) from public;
grant execute on function public.get_contest_predictions(uuid, bigint[]) to authenticated;

notify pgrst, 'reload schema';
