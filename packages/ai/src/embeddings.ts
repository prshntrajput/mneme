import { GoogleGenerativeAI } from '@google/generative-ai';
import { generateWithRetry } from './gemini';

function getEmbeddingClient() {
  const key = process.env.GEMINI_API_KEY;
  if (!key) throw new Error('GEMINI_API_KEY is not set');
  return new GoogleGenerativeAI(key).getGenerativeModel({ model: 'gemini-embedding-001' });
}

export async function generateEmbedding(text: string): Promise<number[]> {
  const model = getEmbeddingClient();
  const result = await generateWithRetry(() =>
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    model.embedContent({
      content: { parts: [{ text: text.slice(0, 8000) }], role: 'user' },
      outputDimensionality: 768,
    } as any),
  );
  return result.embedding.values;
}

export async function generateEmbeddingForTab(
  title: string | null,
  summary: string | null,
  rawContent: string | null,
): Promise<number[]> {
  const input = [title ?? '', summary ?? '', rawContent?.slice(0, 2000) ?? '']
    .filter(Boolean)
    .join('\n\n');

  return generateEmbedding(input);
}
