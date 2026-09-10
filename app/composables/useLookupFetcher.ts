// app/composables/useLookupFetcher.ts
import type { HttpMethod } from '~/core/http'

export const useLookupFetcher = () => {
  const http = useHttp()

  const fetchUrl = async (
    url: string,
    _method: HttpMethod = 'GET',
    _body?: Record<string, any>
  ) => {
    return await http.get(url)
  }

  const extractAllKeys = (
    response: any,
    mode?: 'list'
  ): Record<string, any> => {
    const inner = response?.data?.data ?? response?.data

    if (mode === 'list') {
      if (!Array.isArray(inner) || !inner.length) return {}
      const key = inner[0]?.type
      if (!key) return {}
      return { [key]: inner }
    }

    const container = Array.isArray(inner) ? inner[0] : inner
    if (!container || typeof container !== 'object') return {}

    const result: Record<string, any> = {}
    for (const key of Object.keys(container)) {
      const val = container[key]
      if (typeof val !== 'object' || val === null) continue
      result[key] = val?.data ?? val
    }
    return result
  }

  return { fetchUrl, extractAllKeys }
}
