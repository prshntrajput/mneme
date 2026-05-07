-- Btree indexes for common query patterns
create index tabs_user_id_idx        on public.tabs(user_id);
create index tabs_url_hash_idx       on public.tabs(user_id, url_hash);
create index tabs_category_idx       on public.tabs(user_id, category);
create index tabs_created_at_idx     on public.tabs(user_id, created_at desc);
create index tabs_status_idx         on public.tabs(user_id, status);

-- Full-text search index (GIN) — title + summary only (array_to_string not immutable in index)
create index tabs_fts_idx on public.tabs
  using gin (
    to_tsvector('english'::regconfig,
      coalesce(title, '') || ' ' || coalesce(summary, '')
    )
  );

-- BM25-style keyword search function
create or replace function public.search_tabs_keyword(
  p_user_id uuid,
  p_query   text,
  p_limit   int default 20
)
returns table (
  id          uuid,
  title       text,
  url         text,
  summary     text,
  category    text,
  favicon_url text,
  tags        text[],
  created_at  timestamptz,
  rank        float4
)
language sql stable
as $$
  select
    t.id,
    t.title,
    t.url,
    t.summary,
    t.category,
    t.favicon_url,
    t.tags,
    t.created_at,
    ts_rank(
      to_tsvector('english', coalesce(t.title,'') || ' ' || coalesce(t.summary,'') || ' ' || coalesce(array_to_string(t.tags,' '),'')),
      plainto_tsquery('english', p_query)
    ) as rank
  from public.tabs t
  where t.user_id = p_user_id
    and to_tsvector('english', coalesce(t.title,'') || ' ' || coalesce(t.summary,'') || ' ' || coalesce(array_to_string(t.tags,' '),''))
        @@ plainto_tsquery('english', p_query)
  order by rank desc
  limit p_limit;
$$;

-- Vector similarity search function
create or replace function public.search_tabs_vector(
  p_user_id  uuid,
  p_embedding vector(768),
  p_limit    int default 20
)
returns table (
  id          uuid,
  title       text,
  url         text,
  summary     text,
  category    text,
  favicon_url text,
  tags        text[],
  created_at  timestamptz,
  similarity  float
)
language sql stable
as $$
  select
    t.id,
    t.title,
    t.url,
    t.summary,
    t.category,
    t.favicon_url,
    t.tags,
    t.created_at,
    1 - (t.embedding <=> p_embedding) as similarity
  from public.tabs t
  where t.user_id = p_user_id
    and t.embedding is not null
  order by t.embedding <=> p_embedding
  limit p_limit;
$$;
