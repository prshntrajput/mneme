create table public.processing_jobs (
  id         uuid        primary key default gen_random_uuid(),
  user_id    uuid        references auth.users(id) on delete cascade,
  tab_id     uuid        references public.tabs(id) on delete cascade,
  job_type   text        not null,
  status     text        not null,
  error      text,
  created_at timestamptz not null default now()
);

create index processing_jobs_tab_id_idx on public.processing_jobs(tab_id);
create index processing_jobs_user_id_idx on public.processing_jobs(user_id);
