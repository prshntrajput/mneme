export function buildSessionNamePrompt(tabTitles: string[]): string {
  return `You are naming a browser session snapshot. Based on these tab titles, give this session a short descriptive name (3-6 words) that captures what the user was working on.

Tab titles:
${tabTitles
  .slice(0, 20)
  .map((t, i) => `${i + 1}. ${t}`)
  .join('\n')}

Respond with valid JSON only:
{
  "name": "<3-6 word session name, e.g. 'Tokyo Trip Research' or 'Next.js Auth Setup'>"
}`;
}
