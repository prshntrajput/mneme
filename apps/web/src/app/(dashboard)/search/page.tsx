import { SearchBar } from '@/components/search/search-bar';
import { TabCard } from '@/components/tabs/tab-card';
import { createClient } from '@/lib/supabase/server';
import { generateEmbedding } from '@mneme/ai';

interface SearchPageProps {
  searchParams: Promise<{ q?: string }>;
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

async function searchTabs(userId: string, q: string, limit = 20): Promise<RankedTab[]> {
  const supabase = await createClient();

  let embedding: number[] | null = null;
  try {
    embedding = await generateEmbedding(q);
  } catch {
    // embedding unavailable — fall back to keyword only
  }

  const [keywordResult, vectorResult] = await Promise.all([
    supabase.rpc('search_tabs_keyword', {
      p_user_id: userId,
      p_query: q,
      p_limit: limit * 2,
    }),
    embedding
      ? supabase.rpc('search_tabs_vector', {
          p_user_id: userId,
          p_embedding: JSON.stringify(embedding),
          p_limit: limit * 2,
        })
      : Promise.resolve({ data: [] }),
  ]);

  return reciprocalRankFusion(
    (keywordResult.data ?? []) as RankedTab[],
    (vectorResult.data ?? []) as RankedTab[],
    limit,
  );
}

export default async function SearchPage({ searchParams }: SearchPageProps) {
  const { q } = await searchParams;

  let results: RankedTab[] = [];
  if (q) {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (user) {
      results = await searchTabs(user.id, q);
    }
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Search</h1>
      <SearchBar />

      {q && (
        <p className="text-sm text-gray-500">
          {results.length} results for &ldquo;{q}&rdquo;
        </p>
      )}

      {results.length > 0 ? (
        <div className="grid gap-3">
          {results.map((tab) => (
            <TabCard key={tab.id} tab={tab as Parameters<typeof TabCard>[0]['tab']} />
          ))}
        </div>
      ) : q ? (
        <div className="py-16 text-center text-gray-400">
          No results found. Try a different query.
        </div>
      ) : null}
    </div>
  );
}
