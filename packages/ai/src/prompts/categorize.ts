import { ALL_CATEGORIES } from '@mneme/shared';

export function buildCategorizePrompt(title: string, contentSnippet: string): string {
  return `You are a web page classifier. Classify the following web page into exactly ONE of these categories:
${ALL_CATEGORIES.join(', ')}

Page title: ${title}
Content snippet: ${contentSnippet.slice(0, 1000)}

Respond with valid JSON only:
{
  "category": "<one of the categories above>",
  "tags": ["<tag1>", "<tag2>", "<tag3>"]
}

Tags should be 3-5 specific, lowercase keywords describing the page content.`;
}
