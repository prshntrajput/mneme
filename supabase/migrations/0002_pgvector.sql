-- Enable pgvector (must be done before the column exists if using a cloud project)
create extension if not exists "vector";

-- HNSW index for fast approximate nearest-neighbour search (cosine)
create index tabs_embedding_hnsw_idx
  on public.tabs
  using hnsw (embedding vector_cosine_ops)
  with (m = 16, ef_construction = 64);
