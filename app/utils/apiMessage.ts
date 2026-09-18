export function serverMessage(res: unknown): string | null {
  const meta = (res as { meta?: unknown } | null | undefined)?.meta
  if (typeof meta === 'string') return meta.trim() || null
  const message = (meta as { message?: unknown } | null | undefined)?.message
  return typeof message === 'string' && message.trim() ? message : null
}
