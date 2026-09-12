// app/composables/useCrudListPage.ts
//
// SSR/hydration-safe wrapper around a `useDynamicCrud`-backed domain store's
// list fetch, for PUBLIC pages (courses today, instructors/packages next —
// same shape every time). Two problems this solves once instead of per-page:
//
// 1. Hydration parity: the template must read the list/pagination from
//    `useAsyncData`'s own `data` — the only thing Nuxt guarantees stays in
//    sync between server and client. A store's own refs are populated as a
//    side effect of the fetch and are NOT guaranteed to have hydrated by the
//    time Vue's first client render runs; gating render on them directly
//    caused a real "Hydration completed but contains mismatches" bug on the
//    courses listing page.
// 2. No duplicate fetches: `store.setPage`/`setSearch`/`setFilters` (from
//    `useDynamicCrud`) already fetch internally. Calling `useAsyncData`'s own
//    `refresh()` afterward — the obvious-looking way to keep `data` in sync —
//    fires a SECOND network request for the same page. `run()` below re-reads
//    the now-fresh store state into `data` instead, so there's exactly one
//    request per interaction.
export interface CrudListPageStore {
  page: number
  perPage: number | null
  total: number
  totalPages: number
  setPage: (page: number) => Promise<void>
  setSearch: (term: string) => Promise<void>
  setFilters: (filters: Record<string, unknown>) => Promise<void>
}

export function useCrudListPage<Row>(
  key: string,
  store: CrudListPageStore,
  rows: () => Row[],
  load: () => Promise<void>
) {
  function snapshot() {
    return {
      rows: rows(),
      total: store.total,
      totalPages: store.totalPages,
      page: store.page,
      perPage: store.perPage
    }
  }

  const { data, status } = useAsyncData(key, async () => {
    await load()
    return snapshot()
  })

  // Local, never SSR-transferred — purely a post-hydration UX affordance for
  // setPage/setSearch/setFilters clicks, so it can't itself hydrate wrong.
  const isRefreshing = ref(false)
  const isLoading = computed(() => status.value === 'pending' || isRefreshing.value)

  async function run(action: () => Promise<void>) {
    isRefreshing.value = true
    try {
      await action()
      data.value = snapshot()
    } finally {
      isRefreshing.value = false
    }
  }

  return {
    data,
    isLoading,
    setPage: (page: number) => run(() => store.setPage(page)),
    setSearch: (term: string) => run(() => store.setSearch(term)),
    setFilters: (filters: Record<string, unknown>) => run(() => store.setFilters(filters))
  }
}
