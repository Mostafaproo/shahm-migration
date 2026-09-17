import { defineStore } from 'pinia'
import { toPathway, toPathwayDetail } from '~/types/pathway'
import type { Pathway, PathwayDetail, RawPathway, RawPathwayDetail } from '~/types/pathway'

const LIST_ENDPOINT = 'student/learning-paths'
const PER_PAGE = 20

export type PathwaysTab = 'new' | 'registered'

export const usePathwaysStore = defineStore('pathways', () => {
  const http = useHttp()
  const nuxtApp = useNuxtApp()

  const tab = ref<PathwaysTab>('new')
  const items = ref<Pathway[]>([])
  const page = ref(1)
  const total = ref(0)
  const totalPages = ref(1)
  const isLoading = ref(false)

  const detail = ref<PathwayDetail | null>(null)
  const isLoadingDetail = ref(false)

  function locale(): string {
    return (unref((nuxtApp.$i18n as { locale?: unknown } | undefined)?.locale) as string | undefined) ?? 'ar'
  }

  async function fetchList(targetPage = page.value) {
    isLoading.value = true
    try {
      const res = await http.get<{
        data?: RawPathway[] | { data?: RawPathway[] }
        meta?: { pagination?: { current_page?: number, total_pages?: number, total?: number } }
      }>(`${locale()}/${LIST_ENDPOINT}`, {
        query: {
          page: targetPage,
          paginate: 1,
          per_page: PER_PAGE,
          subscribed: tab.value === 'registered' ? 1 : 0
        }
      })

      const doc = res?.data
      const rows = Array.isArray(doc) ? doc : (doc?.data ?? [])
      items.value = rows.map(toPathway)

      const pagination = res?.meta?.pagination
      page.value = pagination?.current_page ?? targetPage
      totalPages.value = pagination?.total_pages ?? 1
      total.value = pagination?.total ?? items.value.length
    } catch {
      // The http client already surfaced the error toast.
      items.value = []
      total.value = 0
      totalPages.value = 1
    } finally {
      isLoading.value = false
    }
  }

  async function setTab(next: PathwaysTab) {
    if (next === tab.value) return
    tab.value = next
    // Clear before fetching so the skeleton shows rather than the other tab's
    // rows — the cards render differently per tab (progress vs price).
    items.value = []
    page.value = 1
    total.value = 0
    totalPages.value = 1
    await fetchList(1)
  }

  const setPage = (next: number) => fetchList(next)

  async function fetchOne(id: string) {
    isLoadingDetail.value = true
    try {
      const res = await http.get<{ data?: RawPathwayDetail }>(`${locale()}/${LIST_ENDPOINT}/${id}`)
      detail.value = res?.data ? toPathwayDetail(res.data) : null
    } catch {
      detail.value = null
    } finally {
      isLoadingDetail.value = false
    }
  }

  function reset() {
    items.value = []
    page.value = 1
    total.value = 0
    totalPages.value = 1
  }

  return {
    tab,
    items,
    page,
    total,
    totalPages,
    isLoading,
    detail,
    isLoadingDetail,
    fetchList,
    setTab,
    setPage,
    fetchOne,
    reset
  }
})
