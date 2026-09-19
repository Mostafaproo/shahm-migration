import { HttpError } from './errors'
import { deSerializeRes, serializeReq } from './jsonApi'

export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE' | 'HEAD'

/** Minimal `$fetch`-compatible signature (parsed body in, parsed body out). */
export type Fetcher = <T = unknown>(
  url: string,
  options?: Record<string, any>
) => Promise<T>

export interface HttpRequestOptions {
  method?: HttpMethod
  /** Query string params (serialized by the underlying fetcher). */
  query?: Record<string, any>
  /**
   * Request body for write verbs. Auto-wrapped into a JSON:API document by
   * `serializeReq` (expects `{ type, id?, payload }`) unless `serialize: false`.
   */
  body?: any
  serialize?: boolean

  deserialize?: boolean
  /** Per-request headers, merged after the auth header. */
  headers?: Record<string, string>
  signal?: AbortSignal
  /** When true, skip the global error toast (caller handles UX). */
  preventToast?: boolean
  responseType?: 'json' | 'blob'
}

export interface HttpClientConfig {
  /**
   * Prefix for RELATIVE request URLs. Leave unset when callers pass opaque,
   * already-absolute endpoints (e.g. BackendAction.endpoint_url) — otherwise
   * ofetch would double-prefix `/api/...` paths.
   */
  BASE_API_URL?: string

  /**
   * Underlying fetch implementation. Defaults to `globalThis.$fetch` resolved at
   * call time, so the tenant interceptor + any mocks stay in effect.
   */
  fetcher?: Fetcher

  /**
   * Returns the current bearer token, added as `Authorization: Bearer …` when
   * truthy. Read per-request so token rotation is picked up automatically.
   */
  getToken?: () => string | null | undefined

  /** Invoked once whenever a response comes back 401 (e.g. clear the session). */
  onUnauthorized?: () => void

  headers?: Record<string, string> | (() => Record<string, string>)
}

export interface HttpClient {
  request<T = unknown>(url: string, options?: HttpRequestOptions): Promise<T>
  get<T = unknown>(
    url: string,
    options?: Omit<HttpRequestOptions, 'method' | 'body'>,
  ): Promise<T>
  post<T = unknown>(
    url: string,
    body?: any,
    options?: Omit<HttpRequestOptions, 'method' | 'body'>,
  ): Promise<T>
  put<T = unknown>(
    url: string,
    body?: any,
    options?: Omit<HttpRequestOptions, 'method' | 'body'>,
  ): Promise<T>
  patch<T = unknown>(
    url: string,
    body?: any,
    options?: Omit<HttpRequestOptions, 'method' | 'body'>,
  ): Promise<T>
  delete<T = unknown>(
    url: string,
    options?: Omit<HttpRequestOptions, 'method' | 'body'>,
  ): Promise<T>
  download(url: string, options?: HttpRequestOptions): Promise<Blob>
}

export function createHttpClient(config: HttpClientConfig = {}): HttpClient {
  const resolveFetcher = (): Fetcher => {
    const fetcher = config.fetcher ?? (globalThis as any).$fetch
    if (!fetcher) {
      throw new HttpError(
        'No fetcher available — pass config.fetcher or run where $fetch is global'
      )
    }
    return fetcher as Fetcher
  }

  const request = async <T = unknown>(
    url: string,
    options: HttpRequestOptions = {}
  ): Promise<T> => {
    const nuxtApp = useNuxtApp()
    const { $appToast } = nuxtApp
    const defaults
      = typeof config.headers === 'function' ? config.headers() : config.headers
    // Global defaults first, per-request overrides next, auth header last (wins).
    const headers: Record<string, string> = { ...defaults, ...options.headers }
    const token = config.getToken?.()
    if (token) headers.Authorization = `Bearer ${token}`

    const {
      serialize = true,
      deserialize = true,
      preventToast = false
    } = options

    const body
      = options.body != null && serialize
        ? serializeReq(options.body)
        : options.body

    // The global default Content-Type (application/vnd.api+json) must NOT be
    // sent on a FormData body — the browser needs to set its own Content-Type
    // with a generated `boundary=...` parameter for multipart parsing to work
    // at all. Leaving the JSON:API default in place silently breaks every
    // file upload (server sees a content-type that doesn't match the actual
    // multipart body).
    if (typeof FormData !== 'undefined' && body instanceof FormData) {
      delete headers['Content-Type']
      delete headers['content-type']
    }

    try {
      const res = await resolveFetcher()<any>(url, {
        // ofetch's option is `baseURL` — the config field is BASE_API_URL.
        baseURL: config.BASE_API_URL,
        method: options.method,
        query: options.query,
        body,
        headers,
        signal: options.signal,
        responseType: options.responseType
      })

      // Only JSON:API documents get flattened — raw bodies (files, plain JSON
      // without a `data` key) pass through so non-JSON:API endpoints keep working.
      const isJsonApiDoc
        = res !== null && typeof res === 'object' && 'data' in res
      if (deserialize && isJsonApiDoc) {
        return deSerializeRes({ data: res }) as T
      }
      return res as T
    } catch (err) {
      const httpError = HttpError.from(err)
      await nuxtApp.runWithContext(() => {
        if (httpError.isSessionExpired) config.onUnauthorized?.()
        if (!preventToast)
          httpError.messages?.forEach(msg => $appToast.error(msg))
      })
      throw httpError
    }
  }

  return {
    request,
    get: (url, o) => request(url, { ...o, method: 'GET' }),
    post: (url, body, o) => request(url, { ...o, method: 'POST', body }),
    put: (url, body, o) => request(url, { ...o, method: 'PUT', body }),
    patch: (url, body, o) => request(url, { ...o, method: 'PATCH', body }),
    delete: (url, o) => request(url, { ...o, method: 'DELETE' }),
    download: (url: string, options: HttpRequestOptions = {}) =>
      request<Blob>(url, {
        ...options,
        responseType: 'blob',
        deserialize: false,
        serialize: false
      })
  }
}
