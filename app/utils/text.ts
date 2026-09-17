export function stripHtml(value: string | null | undefined): string {
  if (!value) return ''

  const ENTITIES: Record<string, string> = {
    '&nbsp;': ' ',
    '&amp;': '&',
    '&lt;': '<',
    '&gt;': '>',
    '&quot;': '"',
    '&#39;': '\''
  }

  return value
    .replace(/<[^>]*>/g, ' ')
    .replace(/&[a-z#0-9]+;/gi, match => ENTITIES[match.toLowerCase()] ?? match)
    .replace(/\s+/g, ' ')
    .trim()
}
