-- Enable required extensions
create extension if not exists "pgcrypto";
create extension if not exists "pg_trgm";
create extension if not exists "vector";

-- User profiles (mirrors auth.users)
create table public.profiles (
  id         uuid primary key references auth.users(id) on delete cascade,
  email      text not null,
  plan       text not null default 'free' check (plan in ('free', 'pro')),
  tab_quota  int  not null default 1000,
  created_at timestamptz not null default now()
);

-- Auto-create profile on signup
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, email)
  values (new.id, new.email);
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- Tabs (core entity)
create table public.tabs (
  id          uuid        primary key default gen_random_uuid(),
  user_id     uuid        not null references auth.users(id) on delete cascade,
  url         text        not null,
  url_hash    text        generated always as (encode(sha256(url::bytea), 'hex')) stored,
  title       text,
  favicon_url text,
  raw_content text,
  summary     text,
  key_points  text[],
  tags        text[]      not null default '{}',
  category    text,
  embedding   vector(768),
  status      text        not null default 'pending'
                check (status in ('pending', 'processing', 'ready', 'failed')),
  source      text        not null default 'auto'
                check (source in ('auto', 'manual', 'session', 'cleanup')),
  visited_at  timestamptz,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),
  unique (user_id, url_hash)
);

-- Auto-update updated_at
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger tabs_set_updated_at
  before update on public.tabs
  for each row execute procedure public.set_updated_at();
