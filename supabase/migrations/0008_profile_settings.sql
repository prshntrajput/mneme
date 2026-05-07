-- Add blocked_domains to profiles for user-configurable capture blocklist
alter table public.profiles
  add column if not exists blocked_domains text[] not null default '{}';
