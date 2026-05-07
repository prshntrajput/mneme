create table public.collections (
  id           uuid        primary key default gen_random_uuid(),
  user_id      uuid        not null references auth.users(id) on delete cascade,
  name         text        not null,
  description  text,
  ai_generated boolean     not null default true,
  centroid     vector(768),
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now(),
  unique (user_id, name)
);

create trigger collections_set_updated_at
  before update on public.collections
  for each row execute procedure public.set_updated_at();

create table public.collection_tabs (
  collection_id uuid not null references public.collections(id) on delete cascade,
  tab_id        uuid not null references public.tabs(id) on delete cascade,
  similarity    float,
  primary key (collection_id, tab_id)
);
