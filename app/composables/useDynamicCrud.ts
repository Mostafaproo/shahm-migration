import type { Ref } from 'vue'
import type { BackendAction, IPagination, ActionMap } from '~/core/http'

/** A list source: a backend-dictated action or a bare (absolute/relative) URL. */
export type ListSource = BackendAction | string

export interface FetchListOptions {
  /** Extra query params merged into every list request (static filters). */
  query?: Record<string, any>
  /** Query param names, for backends with different conventions. */
  params?: Partial<{
    page: string
    perPage: string
    search: string
    sortBy: string
    sortOrder: string
  }>
}

const DEFAULT_PARAMS = {
  page: 'page',
  perPage: 'per_page',
  search: 'search',
  sortBy: 'sort_by',
  sortOrder: 'sort_order'
} as const

const toAction = (source: ListSource): BackendAction =>
  typeof source === 'string' ? { endpoint_url: source, method: 'GET' } : source

export function useDynamicCrud<T extends { id: string | number }>() {
  // The shared HttpClient (see app/core/http/client.ts).
  const http = useHttp()
  const route = useRoute()
  const router = useRouter()

  // --- 1. List + detail state ---
  // `as Ref<T[]>` sidesteps Vue's UnwrapRefSimple friction with generics, so
  // syncLocalItem can push/assign a `T` without casts.
  const items = ref([]) as Ref<T[]>
  const activeItem = ref<T | null>(null)
  const isLoading = ref(false)
  const error = ref<string | null>(null)
  /** endpoint_url of the action currently executing (row-level spinners). */
  const executing = ref<string | null>(null)

  // Harvested from meta on each fetchList.
  const pagination = ref<IPagination | null>(null)
  const defaultActions = ref<ActionMap>({})
  /** Untouched list meta (e.g. `.filters` for AppDynamicFilters). */
  const rawMeta = ref<Record<string, any>>({})

  // --- Server-driven query state ---
  const page = ref(1)
  const perPage = ref<number | null>(null)
  const sortBy = ref<string | null>(null)
  const sortOrder = ref<'asc' | 'desc'>('asc')
  const search = ref('')
  const filters = ref<Record<string, unknown>>({})

  // Remembered so pagination/sort/search/filter changes can re-fetch.
  const listAction = ref<BackendAction | null>(null)
  const listOptions = ref<FetchListOptions>({})

  const total = computed(() => pagination.value?.total ?? items.value.length)
  const totalPages = computed(() => pagination.value?.total_pages ?? 1)
  const hasRows = computed(() => items.value.length > 0)

  // --- Optional permission guard ---
  // Pass a capability to enforce RBAC (throws 'Unauthorized' when missing);
  // omit/null to bypass — not every endpoint needs one (e.g. public reads).
  const auth = useAuthStore()
  const guard = (capability?: string | null) => {
    if (capability && !auth.can(capability)) throw new Error('Unauthorized')
  }

  function buildQuery(): Record<string, any> {
    const names = { ...DEFAULT_PARAMS, ...listOptions.value.params } as typeof DEFAULT_PARAMS
    const query: Record<string, any> = {
      ...filters.value,
      ...listOptions.value.query,
      [names.page]: page.value
    }
    delete query.action
    if (perPage.value) query[names.perPage] = perPage.value
    if (search.value) query[names.search] = search.value
    if (sortBy.value) {
      query[names.sortBy] = sortBy.value
      query[names.sortOrder] = sortOrder.value
    }
    return query
  }

  // --- URL query sync ---
  // Tracks which filter keys we've written before, so a filter that's
  // removed also disappears from the URL instead of lingering as a stale param.
  let knownFilterKeys: string[] = []

  function syncUrlQuery() {
    const names = { ...DEFAULT_PARAMS, ...listOptions.value.params } as typeof DEFAULT_PARAMS
    const nextQuery: Record<string, string> = { ...(route.query as Record<string, string>) }

    // page — omit when it's the default (1), keep URLs clean
    if (page.value > 1) nextQuery[names.page] = String(page.value)
    else delete nextQuery[names.page]

    if (perPage.value) nextQuery[names.perPage] = String(perPage.value)
    else delete nextQuery[names.perPage]

    if (search.value) nextQuery[names.search] = search.value
    else delete nextQuery[names.search]

    if (sortBy.value) {
      nextQuery[names.sortBy] = sortBy.value
      nextQuery[names.sortOrder] = sortOrder.value
    } else {
      delete nextQuery[names.sortBy]
      delete nextQuery[names.sortOrder]
    }

    // filters — drop previously-written keys first, then re-add current ones
    for (const key of knownFilterKeys) delete nextQuery[key]
    knownFilterKeys = Object.keys(filters.value)
    for (const key of knownFilterKeys) {
      const value = filters.value[key]
      if (value === '' || value == null) continue
      nextQuery[key] = String(value)
    }

    router.push({ query: nextQuery })
  }

  /** Seed page/sort/search/filters from the current URL — call once before the first fetchList. */
  function initFromUrlQuery() {
    const names = { ...DEFAULT_PARAMS, ...listOptions.value.params } as typeof DEFAULT_PARAMS
    const q = route.query as Record<string, string>

    if (q[names.page]) page.value = Number(q[names.page]) || 1
    if (q[names.perPage]) perPage.value = Number(q[names.perPage])
    const searchValue = q[names.search]
    if (searchValue) search.value = searchValue
    const sortByValue = q[names.sortBy]
    if (sortByValue) {
      sortBy.value = sortByValue
      sortOrder.value = (q[names.sortOrder] as 'asc' | 'desc') ?? 'asc'
    }

    // Anything left in the URL that isn't a known reserved key is treated as a filter.
    const reserved = new Set([...Object.values(names), 'action'])
    const seededFilters: Record<string, unknown> = {}
    for (const [key, value] of Object.entries(q)) {
      if (reserved.has(key) || value == null) continue
      seededFilters[key] = value
    }
    if (Object.keys(seededFilters).length) {
      filters.value = seededFilters
      knownFilterKeys = Object.keys(seededFilters)
    }
  }

  // --- 2. List ---
  const fetchList = async (
    source?: ListSource,
    options?: FetchListOptions,
    capability: string | null = null
  ) => {
    guard(capability)
    if (source) listAction.value = toAction(source)
    if (options) listOptions.value = options
    const action = listAction.value
    if (!action) {
      error.value = '[crud] fetchList called without a list source'
      return
    }

    isLoading.value = true
    error.value = null
    try {
      const res = await http.request<{ data?: any, meta?: Record<string, any> }>(
        action.endpoint_url,
        { method: action.method ?? 'GET', query: buildQuery() }
      )

      const doc = res?.data
      items.value = Array.isArray(doc) ? doc : (doc?.data ?? [])

      const meta = (res?.meta
        ?? (Array.isArray(doc) ? {} : doc?.meta)
        ?? {}) as Record<string, any>
      rawMeta.value = meta
      pagination.value = meta.pagination ?? null
      defaultActions.value = meta.default_actions ?? meta.default_action ?? meta.defaultActions ?? {}

      if (pagination.value) {
        page.value = pagination.value.current_page
        perPage.value = pagination.value.per_page
      }
    } catch (err: any) {
      error.value = err?.message ?? `Failed to load list (${action.endpoint_url})`
      items.value = []
      pagination.value = null
    } finally {
      isLoading.value = false
    }
  }

  const refresh = () => fetchList()

  const setPage = async (p: number) => {
    page.value = Math.max(1, Math.min(p, totalPages.value))
    await refresh()
    syncUrlQuery()
  }
  const setPerPage = async (n: number) => {
    perPage.value = n
    page.value = 1
    await refresh()
    syncUrlQuery()
  }
  const setSort = async (field: string) => {
    if (sortBy.value === field) {
      sortOrder.value = sortOrder.value === 'asc' ? 'desc' : 'asc'
    } else {
      sortBy.value = field
      sortOrder.value = 'asc'
    }
    await refresh()
    syncUrlQuery()
  }
  const setSearch = async (term: string) => {
    search.value = term
    page.value = 1
    await refresh()
    syncUrlQuery()
  }
  const setFilters = async (next: Record<string, unknown>) => {
    filters.value = next
    page.value = 1
    await refresh()
    syncUrlQuery()
  }

  // --- 3. Detail + mutations ---
  const fetchOne = async (action: BackendAction, capability: string | null = null) => {
    guard(capability)
    isLoading.value = true
    error.value = null
    try {
      const response = await http.request<{ data: T }>(action.endpoint_url, { method: action.method })
      activeItem.value = (response as any).data ?? (response as unknown as T)
      return activeItem.value
    } catch (err: any) {
      error.value = err.message
      throw err
    } finally {
      isLoading.value = false
    }
  }

  const executeMutation = async <ResultType = T>(
    action: BackendAction,
    payload?: any,
    capability: string | null = null
  ): Promise<ResultType> => {
    guard(capability)
    isLoading.value = true
    error.value = null
    try {
      return await http.request<ResultType>(action.endpoint_url, {
        method: action.method,
        ...(action.method !== 'GET' && action.method !== 'HEAD' && { body: payload })
      })
    } catch (err: any) {
      error.value = err.message
      throw err
    } finally {
      isLoading.value = false
    }
  }

  const syncLocalItem = (item: T, operation: 'add' | 'update' | 'delete') => {
    if (operation === 'add') {
      items.value.unshift(item)
    } else if (operation === 'delete') {
      items.value = items.value.filter(i => i.id !== item.id)
      if (activeItem.value?.id === item.id) activeItem.value = null
    } else if (operation === 'update') {
      const index = items.value.findIndex(i => i.id === item.id)
      if (index !== -1) items.value[index] = item
      if (activeItem.value?.id === item.id) activeItem.value = item
    }
  }

  return {
    items, rows: items, activeItem, isLoading, error, executing,
    pagination, defaultActions, rawMeta,
    page, perPage, sortBy, sortOrder, search, filters,
    total, totalPages, hasRows,
    fetchList, refresh, setPage, setPerPage, setSort, setSearch, setFilters,
    initFromUrlQuery,
    fetchOne, executeMutation, syncLocalItem
  }
}
