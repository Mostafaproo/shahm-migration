// Splits user-authored text into plain and link segments.
//
// The legacy `formattedBody` built an HTML string and rendered it with
// `v-html` — on text a student typed, which is an XSS hole. Returning segments
// lets the template render them with normal interpolation instead, for the
// same result without ever handing raw markup to the DOM.
const URL_MATCHER
  = /(?:(?:https?|ftp|file):\/\/|www\.|ftp\.)(?:\([-A-Z0-9+&@#/%=~_|$?!:,.]*\)|[-A-Z0-9+&@#/%=~_|$?!:,.])*(?:\([-A-Z0-9+&@#/%=~_|$?!:,.]*\)|[A-Z0-9+&@#/%=~_|$])/gim

export interface TextSegment {
  text: string
  /** `null` for plain text, otherwise the absolute href to link to. */
  href: string | null
}

export function linkifySegments(value: string): TextSegment[] {
  if (!value) return []

  const segments: TextSegment[] = []
  let cursor = 0

  for (const match of value.matchAll(URL_MATCHER)) {
    const start = match.index ?? 0
    if (start > cursor) segments.push({ text: value.slice(cursor, start), href: null })

    const url = match[0]
    // Bare `www.`/`ftp.` matches need a scheme or the browser treats them
    // as a relative path.
    const href = /^[a-z]+:\/\//i.test(url) ? url : `https://${url}`
    segments.push({ text: url, href })
    cursor = start + url.length
  }

  if (cursor < value.length) segments.push({ text: value.slice(cursor), href: null })
  return segments
}
