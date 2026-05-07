export function buildClusterNamePrompt(tabSummaries: string[]): string {
  return `You are organizing a user's browser tabs into a named collection.

Here are summaries of the related tabs:
${tabSummaries
  .slice(0, 10)
  .map((s, i) => `${i + 1}. ${s}`)
  .join('\n')}

Create a short, descriptive name for this collection (2-4 words) and a one-sentence description.

Respond with valid JSON only:
{
  "name": "<2-4 word collection name>",
  "description": "<one sentence describing what this collection is about>"
}`;
}
