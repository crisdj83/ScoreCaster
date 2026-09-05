-- Run this in the Supabase SQL editor if unread message badges fail with:
-- "Could not find the table 'public.message_reads' in the schema cache"
create table if not exists public.message_reads (
  user_id uuid primary key references public.users(id) on delete cascade,
  last_read_at timestamptz not null default now()
);

alter table public.message_reads enable row level security;

drop policy if exists "Users can manage their message read state" on public.message_reads;
create policy "Users can manage their message read state"
  on public.message_reads for all
  to authenticated
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));
