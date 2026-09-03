create table if not exists public.news_posts (
  id uuid primary key default gen_random_uuid(),
  author_id uuid not null references public.users(id) on delete cascade,
  title text not null,
  body text not null,
  created_at timestamptz not null default now()
);

create table if not exists public.news_replies (
  id uuid primary key default gen_random_uuid(),
  post_id uuid not null references public.news_posts(id) on delete cascade,
  author_id uuid not null references public.users(id) on delete cascade,
  body text not null,
  created_at timestamptz not null default now()
);

create table if not exists public.news_reads (
  user_id uuid primary key references public.users(id) on delete cascade,
  last_read_at timestamptz not null default now()
);

create index if not exists news_posts_created_at_idx on public.news_posts(created_at desc);
create index if not exists news_replies_post_id_idx on public.news_replies(post_id, created_at);

alter table public.news_posts enable row level security;
alter table public.news_replies enable row level security;
alter table public.news_reads enable row level security;
