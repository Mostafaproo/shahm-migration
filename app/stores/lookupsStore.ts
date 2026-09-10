// app/stores/lookupsStore.ts
import { ref } from 'vue'
import { defineStore } from 'pinia'
import type { BackendAction } from '~/core/http'

// Extend as domains are migrated, e.g. "student" | "instructor" | "parent".
type LookupModule = never

// Either a static module name, or a full backend-provided action object.
export type LookupSource = LookupModule | BackendAction

const isLookupAction = (source: LookupSource): source is BackendAction => {
  return (
    typeof source === 'object' && source !== null && 'endpoint_url' in source
  )
}

function normalizeIncludeKeys(include: unknown): string[] {
  if (Array.isArray(include)) {
    return include.map(String).map(k => k.trim()).filter(Boolean)
  }
  if (typeof include === 'string' && include.trim()) {
    return include.split(',').map(k => k.trim()).filter(Boolean)
  }
  return []
}

export const useLookupsStore = defineStore('lookups', () => {
  const { fetchUrl, extractAllKeys } = useLookupFetcher()

  const lookups = ref<Record<string, any>>({})

  const buildUrl = (source: LookupSource): string => {
    // Case: backend already gave us a full action object — just use it.
    if (isLookupAction(source)) {
      return source.endpoint_url
    }

    // Case: static module — add entries here as domains are migrated.
    throw new Error(`Unknown lookup module: ${String(source)}`)
  }

  /** Clear all cached lookups, or only the listed keys. */
  const resetLookups = (...keys: string[]) => {
    if (!keys.length) {
      lookups.value = {}
      return
    }
    const next = { ...lookups.value }
    for (const key of keys) delete next[key]
    lookups.value = next
  }

  // The one function — accepts either a module name or a full action object.
  const fetchLookups = async (
    source: LookupSource,
    paramsOrMode?: Record<string, any> | 'list',
    mode?: 'list' // "list" = flat array saved under key = items[0].type
  ) => {
    const method = isLookupAction(source) ? source.method || 'GET' : 'GET'
    const params = typeof paramsOrMode === 'string' ? undefined : paramsOrMode
    const resolvedMode = typeof paramsOrMode === 'string' ? paramsOrMode : mode

    const url = buildUrl(source)
    const response = await fetchUrl(url, method, params)
    const extracted = extractAllKeys(response, resolvedMode)
    const includeKeys = normalizeIncludeKeys(params?.include)

    // Replace requested include keys (even with []) so a new page/cascade
    // never keeps stale options from a previous fetch that omitted that key.
    if (includeKeys.length) {
      const next = { ...lookups.value }
      for (const key of includeKeys) {
        next[key] = extracted[key] ?? []
      }
      for (const [key, value] of Object.entries(extracted)) {
        if (!includeKeys.includes(key)) next[key] = value
      }
      lookups.value = next
    } else {
      lookups.value = { ...lookups.value, ...extracted }
    }

    return extracted
  }

  return {
    lookups,
    fetchLookups,
    resetLookups
  }
})
