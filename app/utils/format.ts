/** Legacy `bytesToSize`, used by the uploader's per-file progress line. */
export function bytesToSize(bytes: number): string {
  if (!bytes) return '0 B'
  const units = ['B', 'KB', 'MB', 'GB', 'TB']
  const i = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), units.length - 1)
  return `${Math.round(bytes / 1024 ** i)} ${units[i]}`
}

/**
 * `<input type="datetime-local">` speaks `YYYY-MM-DDTHH:mm`; this API speaks
 * `YYYY-MM-DD HH:mm:ss` — the format the legacy's date picker was pinned to.
 * Passing either one through untranslated fails silently: the API rejects the
 * `T`, and the input renders blank for a value with a space.
 */
export function toDateTimeInput(value: string): string {
  if (!value) return ''
  return value.replace(' ', 'T').slice(0, 16)
}

export function toDateTimeApi(value: string): string {
  if (!value) return ''
  const normalized = value.replace('T', ' ')
  // The input omits seconds; the API expects them.
  return normalized.length === 16 ? `${normalized}:00` : normalized
}
