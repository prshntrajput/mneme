import { Inngest } from 'inngest';
import { createClient } from '@supabase/supabase-js';
import type { Database } from '@mneme/database';
import { generateJson } from './gemini';
import { buildClusterNamePrompt } from './prompts/cluster';

const inngest = new Inngest({ id: 'mneme' });

interface ClusterNameResult {
  name: string;
  description: string;
}

const SIMILARITY_THRESHOLD = 0.75;
const MIN_CLUSTER_SIZE = 3;
const MAX_TABS_TO_CLUSTER = 500;

export const clusterCollections = inngest.createFunction(
  {
    id: 'cluster-collections',
    concurrency: { limit: 2 },
  },
  // Runs every 6 hours
  { cron: '0 */6 * * *' },
  async ({ step }) => {
    const db = getAdminClient();

    // Get all users with enough embedded tabs
    const { data: users } = await db
      .from('tabs')
      .select('user_id')
      .eq('status', 'ready')
      .not('embedding', 'is', null);

    const uniqueUserIds = [...new Set((users ?? []).map((u) => u.user_id))];

    for (const userId of uniqueUserIds) {
      await step.run(`cluster-user-${userId}`, async () => {
        await clusterForUser(userId, db);
      });
    }

    return { clustered: uniqueUserIds.length };
  },
);

async function clusterForUser(
  userId: string,
  db: ReturnType<typeof getAdminClient>,
): Promise<void> {
  const { data: tabs } = await db
    .from('tabs')
    .select('id, title, summary, embedding')
    .eq('user_id', userId)
    .eq('status', 'ready')
    .not('embedding', 'is', null)
    .order('created_at', { ascending: false })
    .limit(MAX_TABS_TO_CLUSTER);

  if (!tabs || tabs.length < MIN_CLUSTER_SIZE) return;

  const clusters = greedyCosineClusters(
    tabs as Array<{
      id: string;
      title: string | null;
      summary: string | null;
      embedding: number[];
    }>,
  );

  for (const cluster of clusters) {
    if (cluster.length < MIN_CLUSTER_SIZE) continue;

    const summaries = cluster.map((t) => t.summary ?? t.title ?? '').filter(Boolean);

    const { name, description } = await generateJson<ClusterNameResult>(
      buildClusterNamePrompt(summaries),
    );

    // Compute centroid
    const centroid = computeCentroid(cluster.map((t) => t.embedding));

    const { data: collection } = await db
      .from('collections')
      .upsert(
        {
          user_id: userId,
          name,
          description,
          ai_generated: true,
          centroid: centroid as unknown as number[],
        },
        { onConflict: 'user_id,name' },
      )
      .select('id')
      .single();

    if (!collection) continue;

    await db.from('collection_tabs').upsert(
      cluster.map((t) => ({ collection_id: collection.id, tab_id: t.id, similarity: 1 })),
      { onConflict: 'collection_id,tab_id' },
    );
  }
}

function cosineSimilarity(a: number[], b: number[]): number {
  let dot = 0;
  let normA = 0;
  let normB = 0;
  for (let i = 0; i < a.length; i++) {
    dot += a[i]! * b[i]!;
    normA += a[i]! ** 2;
    normB += b[i]! ** 2;
  }
  return dot / (Math.sqrt(normA) * Math.sqrt(normB));
}

function computeCentroid(embeddings: number[][]): number[] {
  const dim = embeddings[0]!.length;
  const centroid = new Array<number>(dim).fill(0);
  for (const emb of embeddings) {
    for (let i = 0; i < dim; i++) {
      centroid[i]! += emb[i]! / embeddings.length;
    }
  }
  return centroid;
}

interface TabWithEmbedding {
  id: string;
  title: string | null;
  summary: string | null;
  embedding: number[];
}

function greedyCosineClusters(tabs: TabWithEmbedding[]): TabWithEmbedding[][] {
  const assigned = new Set<string>();
  const clusters: TabWithEmbedding[][] = [];

  for (const seed of tabs) {
    if (assigned.has(seed.id)) continue;

    const cluster: TabWithEmbedding[] = [seed];
    assigned.add(seed.id);

    for (const candidate of tabs) {
      if (assigned.has(candidate.id)) continue;
      if (cosineSimilarity(seed.embedding, candidate.embedding) >= SIMILARITY_THRESHOLD) {
        cluster.push(candidate);
        assigned.add(candidate.id);
      }
    }

    clusters.push(cluster);
  }

  return clusters;
}

function getAdminClient() {
  return createClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } },
  );
}
