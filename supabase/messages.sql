-- Discussion messages are scoped to contests. Website announcements remain in
-- news_posts and are rendered on the homepage only.
create table if not exists public.messages (
  id uuid primary key default gen_random_uuid(),
  contest_id uuid not null references public.contests(id) on delete cascade,
  author_id uuid not null references public.users(id) on delete cascade,
  title text not null check (char_length(title) between 1 and 120),
  body text not null check (char_length(body) between 1 and 5000),
  created_at timestamptz not null default now()
);

create table if not exists public.message_replies (
  id uuid primary key default gen_random_uuid(),
  message_id uuid not null references public.messages(id) on delete cascade,
  author_id uuid not null references public.users(id) on delete cascade,
  body text not null check (char_length(body) between 1 and 5000),
  created_at timestamptz not null default now()
);

create table if not exists public.message_reads (
  user_id uuid primary key references public.users(id) on delete cascade,
  last_read_at timestamptz not null default now()
);

create index if not exists messages_contest_created_at_idx
  on public.messages(contest_id, created_at desc);
create index if not exists message_replies_message_created_at_idx
  on public.message_replies(message_id, created_at);

alter table public.messages enable row level security;
alter table public.message_replies enable row level security;
alter table public.message_reads enable row level security;

drop policy if exists "Contest members can view messages" on public.messages;
create policy "Contest members can view messages"
  on public.messages for select
  to authenticated
  using (
    exists (
      select 1
      from public.contest_members
      where contest_members.contest_id = messages.contest_id
        and contest_members.user_id = (select auth.uid())
    )
  );

drop policy if exists "Contest members can post messages" on public.messages;
create policy "Contest members can post messages"
  on public.messages for insert
  to authenticated
  with check (
    author_id = (select auth.uid())
    and exists (
      select 1
      from public.contest_members
      where contest_members.contest_id = messages.contest_id
        and contest_members.user_id = (select auth.uid())
    )
  );

drop policy if exists "Authors and contest admins can update messages" on public.messages;
create policy "Authors and contest admins can update messages"
  on public.messages for update
  to authenticated
  using (
    author_id = (select auth.uid())
    or exists (
      select 1
      from public.contest_members
      where contest_members.contest_id = messages.contest_id
        and contest_members.user_id = (select auth.uid())
        and contest_members.role = 'admin'
    )
  )
  with check (
    (
      author_id = (select auth.uid())
      or exists (
        select 1
        from public.contest_members
        where contest_members.contest_id = messages.contest_id
          and contest_members.user_id = (select auth.uid())
          and contest_members.role = 'admin'
      )
    )
    and exists (
      select 1
      from public.contest_members
      where contest_members.contest_id = messages.contest_id
        and contest_members.user_id = (select auth.uid())
    )
  );

drop policy if exists "Authors and contest admins can delete messages" on public.messages;
create policy "Authors and contest admins can delete messages"
  on public.messages for delete
  to authenticated
  using (
    author_id = (select auth.uid())
    or exists (
      select 1
      from public.contest_members
      where contest_members.contest_id = messages.contest_id
        and contest_members.user_id = (select auth.uid())
        and contest_members.role = 'admin'
    )
  );

drop policy if exists "Contest members can view message replies" on public.message_replies;
create policy "Contest members can view message replies"
  on public.message_replies for select
  to authenticated
  using (
    exists (
      select 1
      from public.messages
      join public.contest_members
        on contest_members.contest_id = messages.contest_id
      where messages.id = message_replies.message_id
        and contest_members.user_id = (select auth.uid())
    )
  );

drop policy if exists "Contest members can post message replies" on public.message_replies;
create policy "Contest members can post message replies"
  on public.message_replies for insert
  to authenticated
  with check (
    author_id = (select auth.uid())
    and exists (
      select 1
      from public.messages
      join public.contest_members
        on contest_members.contest_id = messages.contest_id
      where messages.id = message_replies.message_id
        and contest_members.user_id = (select auth.uid())
    )
  );

drop policy if exists "Authors and contest admins can update message replies" on public.message_replies;
create policy "Authors and contest admins can update message replies"
  on public.message_replies for update
  to authenticated
  using (
    author_id = (select auth.uid())
    or exists (
      select 1
      from public.messages
      join public.contest_members
        on contest_members.contest_id = messages.contest_id
      where messages.id = message_replies.message_id
        and contest_members.user_id = (select auth.uid())
        and contest_members.role = 'admin'
    )
  )
  with check (
    (
      author_id = (select auth.uid())
      or exists (
        select 1
        from public.messages
        join public.contest_members
          on contest_members.contest_id = messages.contest_id
        where messages.id = message_replies.message_id
          and contest_members.user_id = (select auth.uid())
          and contest_members.role = 'admin'
      )
    )
    and exists (
      select 1
      from public.messages
      join public.contest_members
        on contest_members.contest_id = messages.contest_id
      where messages.id = message_replies.message_id
        and contest_members.user_id = (select auth.uid())
    )
  );

drop policy if exists "Authors and contest admins can delete message replies" on public.message_replies;
create policy "Authors and contest admins can delete message replies"
  on public.message_replies for delete
  to authenticated
  using (
    author_id = (select auth.uid())
    or exists (
      select 1
      from public.messages
      join public.contest_members
        on contest_members.contest_id = messages.contest_id
      where messages.id = message_replies.message_id
        and contest_members.user_id = (select auth.uid())
        and contest_members.role = 'admin'
    )
  );

drop policy if exists "Users can manage their message read state" on public.message_reads;
create policy "Users can manage their message read state"
  on public.message_reads for all
  to authenticated
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));
