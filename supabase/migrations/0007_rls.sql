-- Enable RLS on every table — no exceptions
alter table public.profiles        enable row level security;
alter table public.tabs            enable row level security;
alter table public.collections     enable row level security;
alter table public.collection_tabs enable row level security;
alter table public.sessions        enable row level security;
alter table public.session_tabs    enable row level security;
alter table public.processing_jobs enable row level security;

-- ── profiles ──────────────────────────────────────────────────────────────
create policy "profiles_select_own" on public.profiles
  for select using (auth.uid() = id);
create policy "profiles_update_own" on public.profiles
  for update using (auth.uid() = id);

-- ── tabs ──────────────────────────────────────────────────────────────────
create policy "tabs_select_own" on public.tabs
  for select using (auth.uid() = user_id);
create policy "tabs_insert_own" on public.tabs
  for insert with check (auth.uid() = user_id);
create policy "tabs_update_own" on public.tabs
  for update using (auth.uid() = user_id);
create policy "tabs_delete_own" on public.tabs
  for delete using (auth.uid() = user_id);

-- ── collections ───────────────────────────────────────────────────────────
create policy "collections_select_own" on public.collections
  for select using (auth.uid() = user_id);
create policy "collections_insert_own" on public.collections
  for insert with check (auth.uid() = user_id);
create policy "collections_update_own" on public.collections
  for update using (auth.uid() = user_id);
create policy "collections_delete_own" on public.collections
  for delete using (auth.uid() = user_id);

-- ── collection_tabs ───────────────────────────────────────────────────────
-- Join-checked: user can only see collection_tabs for collections they own
create policy "collection_tabs_select_own" on public.collection_tabs
  for select using (
    exists (
      select 1 from public.collections c
      where c.id = collection_tabs.collection_id
        and c.user_id = auth.uid()
    )
  );
create policy "collection_tabs_insert_own" on public.collection_tabs
  for insert with check (
    exists (
      select 1 from public.collections c
      where c.id = collection_tabs.collection_id
        and c.user_id = auth.uid()
    )
  );
create policy "collection_tabs_delete_own" on public.collection_tabs
  for delete using (
    exists (
      select 1 from public.collections c
      where c.id = collection_tabs.collection_id
        and c.user_id = auth.uid()
    )
  );

-- ── sessions ──────────────────────────────────────────────────────────────
create policy "sessions_select_own" on public.sessions
  for select using (auth.uid() = user_id);
create policy "sessions_insert_own" on public.sessions
  for insert with check (auth.uid() = user_id);
create policy "sessions_update_own" on public.sessions
  for update using (auth.uid() = user_id);
create policy "sessions_delete_own" on public.sessions
  for delete using (auth.uid() = user_id);

-- ── session_tabs ──────────────────────────────────────────────────────────
create policy "session_tabs_select_own" on public.session_tabs
  for select using (
    exists (
      select 1 from public.sessions s
      where s.id = session_tabs.session_id
        and s.user_id = auth.uid()
    )
  );
create policy "session_tabs_insert_own" on public.session_tabs
  for insert with check (
    exists (
      select 1 from public.sessions s
      where s.id = session_tabs.session_id
        and s.user_id = auth.uid()
    )
  );
create policy "session_tabs_delete_own" on public.session_tabs
  for delete using (
    exists (
      select 1 from public.sessions s
      where s.id = session_tabs.session_id
        and s.user_id = auth.uid()
    )
  );

-- ── processing_jobs ───────────────────────────────────────────────────────
create policy "processing_jobs_select_own" on public.processing_jobs
  for select using (auth.uid() = user_id);
