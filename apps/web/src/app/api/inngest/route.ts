import { serve } from 'inngest/next';
import { inngest } from '@/lib/inngest';
import {
  categorizeTab,
  summarizeTab,
  embedTab,
  clusterCollections,
  detectDuplicates,
  nameSession,
} from '@mneme/ai';

export const { GET, POST, PUT } = serve({
  client: inngest,
  functions: [
    categorizeTab,
    summarizeTab,
    embedTab,
    clusterCollections,
    detectDuplicates,
    nameSession,
  ],
});
