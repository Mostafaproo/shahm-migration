export function serverMessage(res: unknown): string | null {
  const meta = (res as { meta?: unknown } | null | undefined)?.meta
  if (typeof meta === 'string') return meta.trim() || null

  // Four spellings are in use: a bare string (discussion toggle),
  // `meta.message` (attach-link, profile), `meta.messages` (end-exam) and a
  // top-level `message` (register — the legacy reads `res.data.message`).
  // The last one can only appear on a non-JSON:API body: the client rewrites
  // anything with a top-level `data` key into `{ data: ... }`.
  const bag = meta as { message?: unknown, messages?: unknown } | null | undefined
  const root = res as { message?: unknown } | null | undefined
  for (const value of [bag?.message, bag?.messages, root?.message]) {
    if (typeof value === 'string' && value.trim()) return value
  }
  return null
}
