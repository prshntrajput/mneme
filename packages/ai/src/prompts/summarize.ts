export function buildSummarizePrompt(title: string, rawContent: string): string {
  // Truncate to ~8k tokens (approx 32k chars is safe)
  const content = rawContent.slice(0, 32_000);

  return `Summarize the following web page concisely.

Title: ${title}
Content:
${content}

Respond with valid JSON only:
{
  "summary": "<1-2 sentence summary of what this page is about>",
  "key_points": ["<key point 1>", "<key point 2>", "<key point 3>"]
}

The summary should capture the main purpose/content. Key points should be 3-5 bullets of the most important information.`;
}
