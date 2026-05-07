create table public.sessions (
  id         uuid        primary key default gen_random_uuid(),
  user_id    uuid        not null references auth.users(id) on delete cascade,
  name       text,
  ai_name    text,
  tab_count  int         not null default 0,
  created_at timestamptz not null default now()
);

create table public.session_tabs (
  session_id uuid not null references public.sessions(id) on delete cascade,
  tab_id     uuid not null references public.tabs(id) on delete cascade,
  position   int,
  primary key (session_id, tab_id)
);
