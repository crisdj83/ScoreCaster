create table if not exists public.suggestions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  title text not null check (char_length(title) between 1 and 120),
  description text not null check (char_length(description) between 1 and 2000),
  status text not null default 'submitted' check (status in ('submitted', 'planned', 'in_progress', 'completed', 'declined')),
  created_at timestamptz not null default now()
);

create index if not exists suggestions_created_at_idx on public.suggestions(created_at desc);

alter table public.suggestions enable row level security;

drop policy if exists "Authenticated users can view suggestions" on public.suggestions;
create policy "Authenticated users can view suggestions"
  on public.suggestions for select
  to authenticated
  using (true);

drop policy if exists "Users can submit their own suggestions" on public.suggestions;
create policy "Users can submit their own suggestions"
  on public.suggestions for insert
  to authenticated
  with check ((select auth.uid()) = user_id);
