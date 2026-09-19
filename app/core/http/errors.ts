export class HttpError extends Error {
  constructor(
    message: string,
    public readonly status: number | null = null,
    public readonly code: string | null = null,
    public readonly data: unknown = null,
    public readonly messages: string[] = []
  ) {
    super(message)
    this.name = 'HttpError'
  }

  /** True for failures with no response (network down, CORS, timeout, abort). */
  get isNetworkError(): boolean {
    return this.status === null
  }


  get isSessionExpired(): boolean {
    if (this.status !== 401) return false
    return this.errorTitle === 'unauthorized_action'
  }

 
  get isForbidden(): boolean {
    return this.status === 403
  }

  /** First JSON:API error title, which is how this backend classifies faults. */
  get errorTitle(): string | null {
    const body = this.data as { errors?: { title?: unknown }[] } | null
    const title = body?.errors?.[0]?.title
    return typeof title === 'string' ? title : null
  }

  /** Coerce any thrown value into an HttpError, extracting the best message(s). */
  static from(err: unknown): HttpError {
    if (err instanceof HttpError) return err

    if (err && typeof err === 'object') {
      const e = err as Record<string, any>
      // ofetch FetchError exposes statusCode/status + parsed `data`.
      const rawStatus = e.statusCode ?? e.status ?? e.response?.status
      const status = typeof rawStatus === 'number' ? rawStatus : null
      const data = e.data ?? e.response?._data ?? null
      const messages = extractMessage(data)
      const message = messages.length ? messages.join('; ') : (typeof e.message === 'string' ? e.message : null)
      if (status !== null || data !== null || message) {
        // Attach the original data and the extracted messages for callers to loop.
        return new HttpError(message ?? 'HTTP request failed', status, e.code ?? null, data, messages)
      }
    }

    const message = err instanceof Error ? err.message : 'Unknown HTTP error'
    return new HttpError(message)
  }
}

/**
 * Pull a human-readable message out of a backend error body. Tolerates the
 * common envelopes ({ message }, { meta.message }, { error }, { errors: [...] })
 * and falls back to null so the caller can use the engine message instead.
 */
function extractMessage(data: unknown): string[] {
  if (!data) return []
  if (typeof data === 'string') return [data]
  if (typeof data === 'object') {
    const body = data as Record<string, unknown>
    const out: string[] = []
    if (typeof body.message === 'string') out.push(body.message)
    // Admission / payment APIs often return `{ meta: { message } }` on 422.
    const meta = body.meta as { message?: unknown } | undefined
    if (meta && typeof meta.message === 'string') out.push(meta.message)
    if (typeof body.error === 'string') out.push(body.error)
    if (typeof body.detail === 'string') out.push(body.detail)
    if (Array.isArray(body.errors)) {
      const errs = body.errors as any[]
      for (const item of errs) {
        if (!item) continue
        if (typeof item === 'string') {
          out.push(item)
          continue
        }
        if (typeof item === 'object') {
          const f = item as Record<string, any>
          if (typeof f.detail === 'string') out.push(f.detail)
          else if (typeof f.title === 'string') out.push(f.title)
          else if (typeof f.message === 'string') out.push(f.message)
          else {
            try {
              out.push(JSON.stringify(f))
            } catch {
              // ignore
            }
          }
        }
      }
    }
    return out
  }
  return []
}
