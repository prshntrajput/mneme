import { GoogleGenerativeAI } from '@google/generative-ai';

function getClient(): GoogleGenerativeAI {
  const key = process.env.GEMINI_API_KEY;
  if (!key) throw new Error('GEMINI_API_KEY is not set');
  return new GoogleGenerativeAI(key);
}

export function getFlashModel() {
  return getClient().getGenerativeModel({ model: 'gemini-2.0-flash' });
}

export function getProModel() {
  return getClient().getGenerativeModel({ model: 'gemini-2.0-flash' });
}

export async function generateWithRetry<T>(
  fn: () => Promise<T>,
  retries = 3,
  baseDelayMs = 1000,
): Promise<T> {
  for (let attempt = 0; attempt < retries; attempt++) {
    try {
      return await fn();
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      // Don't retry quota errors — throw immediately so Inngest handles backoff
      if (msg.includes('429') || msg.includes('quota') || msg.includes('RESOURCE_EXHAUSTED')) {
        throw err;
      }
      if (attempt === retries - 1) throw err;
      await new Promise((r) => setTimeout(r, baseDelayMs * 2 ** attempt));
    }
  }
  throw new Error('generateWithRetry exhausted');
}

export async function generateJson<T>(prompt: string, model = getFlashModel()): Promise<T> {
  const result = await generateWithRetry(() =>
    model.generateContent({
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
      generationConfig: {
        responseMimeType: 'application/json',
        temperature: 0.2,
      },
    }),
  );

  const text = result.response.text();
  return JSON.parse(text) as T;
}
