import { NextResponse, type NextRequest } from 'next/server';
import { z } from 'zod';
import { createClient } from '@/lib/supabase/server';
import { rateLimit, rateLimitResponse } from '@/lib/rate-limit';
import { generateEmbedding } from '@mneme/ai';
import { getCorsHeaders, corsOptionsResponse } from '@/lib/cors';

export async function OPTIONS(request: NextRequest) {
  return corsOptionsResponse(request);
}

const SearchBodySchema = z.object({
  q: z.string().min(1).max(500),
  limit: z.number().int().min(1).max(50).default(20),
  category: z.string().optional(),
});

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  if (!rateLimit(`search:${user.id}`, 30, 60_000)) {
    return rateLimitResponse();
  }

  const body: unknown = await request.json();
  const parsed = SearchBodySchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Invalid request', issues: parsed.error.issues },
      { status: 400 },
    );
  }

  const cors = getCorsHeaders(request);
  const { q, limit } = parsed.data;

  // Embed the query
  const embedding = await generateEmbedding(q);

  // Run keyword + vector in parallel
  const [keywordResult, vectorResult] = await Promise.all([
    supabase.rpc('search_tabs_keyword', {
      p_user_id: user.id,
      p_query: q,
      p_limit: limit * 2,
    }),
    supabase.rpc('search_tabs_vector', {
      p_user_id: user.id,
      p_embedding: JSON.stringify(embedding),
      p_limit: limit * 2,
    }),
  ]);

  // Reciprocal Rank Fusion
  const results = reciprocalRankFusion(keywordResult.data ?? [], vectorResult.data ?? [], limit);

  return NextResponse.json({ results, query: q }, { headers: cors });
}

interface RankedTab {
  id: string;
  [key: string]: unknown;
}

function reciprocalRankFusion(
  keywordResults: RankedTab[],
  vectorResults: RankedTab[],
  limit: number,
  k = 60,
): RankedTab[] {
  const scores = new Map<string, number>();
  const tabsById = new Map<string, RankedTab>();

  for (const [rank, tab] of keywordResults.entries()) {
    scores.set(tab.id, (scores.get(tab.id) ?? 0) + 1 / (k + rank + 1));
    tabsById.set(tab.id, tab);
  }

  for (const [rank, tab] of vectorResults.entries()) {
    scores.set(tab.id, (scores.get(tab.id) ?? 0) + 1 / (k + rank + 1));
    tabsById.set(tab.id, tab);
  }

  return [...scores.entries()]
    .sort(([, a], [, b]) => b - a)
    .slice(0, limit)
    .map(([id]) => tabsById.get(id)!);
}
