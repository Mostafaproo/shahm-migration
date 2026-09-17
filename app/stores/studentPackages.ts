// app/stores/studentPackages.ts
//
// Dashboard packages — ported from the legacy `pages/course-packages` +
// `store/all_packages`:
//   GET student/packages?subscribed=0|1&paginate=1&page=N
//   GET student/packages/{id}
//
// Two tabs, exactly like the legacy: "الحزم الجديدة" (`subscribed=0`) and
// "الحزم المسجلة" (`subscribed=1`). Paging appends, page 1 replaces.
//
// Not ported: the `parent` branch of the legacy action, which hits
// `parent/packages/{student_id}` and hand-builds `actions` client-side. That
// belongs with the parent domain, which hasn't been migrated yet.
import { defineStore } from 'pinia'
import { toStudentCoursePackage, toStudentCoursePackageDetail } from '~/types/package'
import type {
  RawStudentCoursePackage,
  RawStudentCoursePackageDetail,
  StudentCoursePackage,
  StudentCoursePackageDetail
} from '~/types/package'

export type PackagesTab = 'new' | 'registered'

export const useStudentPackagesStore = defineStore('studentPackages', () => {
  const http = useHttp()
  const nuxtApp = useNuxtApp()

  const tab = ref<PackagesTab>('new')
  const items = ref<StudentCoursePackage[]>([])
  const currentPage = ref(1)
  const totalPages = ref(1)
  const isLoading = ref(false)

  const packageDetail = ref<StudentCoursePackageDetail | null>(null)
  const isLoadingDetail = ref(false)

  const hasMore = computed(() => currentPage.value < totalPages.value)

  function locale(): string {
    return (unref((nuxtApp.$i18n as { locale?: unknown } | undefined)?.locale) as string | undefined) ?? 'ar'
  }

  async function load(page: number) {
    isLoading.value = true
    try {
      const res = await http.get<{
        data?: RawStudentCoursePackage[] | { data?: RawStudentCoursePackage[] }
        meta?: { pagination?: { current_page?: number, total_pages?: number } }
      }>(`${locale()}/student/packages`, {
        query: {
          subscribed: tab.value === 'registered' ? 1 : 0,
          paginate: 1,
          page
        }
      })

      const doc = res?.data
      const rows = (Array.isArray(doc) ? doc : (doc?.data ?? [])).map(toStudentCoursePackage)

      const pagination = res?.meta?.pagination
      currentPage.value = pagination?.current_page ?? page
      totalPages.value = pagination?.total_pages ?? 1

      items.value = page === 1 ? rows : [...items.value, ...rows]
    } catch {
      // The http client already surfaced the error toast.
      if (page === 1) items.value = []
      totalPages.value = currentPage.value
    } finally {
      isLoading.value = false
    }
  }

  const fetchList = () => load(1)

  async function loadMore() {
    if (!hasMore.value || isLoading.value) return
    await load(currentPage.value + 1)
  }

  async function setTab(next: PackagesTab) {
    if (next === tab.value) return
    tab.value = next
    // Clear before fetching so the skeleton shows instead of the other tab's
    // rows — same reasoning as the dashboard courses page.
    items.value = []
    currentPage.value = 1
    totalPages.value = 1
    await fetchList()
  }

  async function fetchOne(id: string) {
    isLoadingDetail.value = true
    try {
      const res = await http.get<{ data?: RawStudentCoursePackageDetail }>(
        `${locale()}/student/packages/${id}`
      )
      packageDetail.value = res?.data ? toStudentCoursePackageDetail(res.data) : null
    } catch {
      packageDetail.value = null
    } finally {
      isLoadingDetail.value = false
    }
  }

  function reset() {
    items.value = []
    currentPage.value = 1
    totalPages.value = 1
  }

  return {
    tab,
    items,
    isLoading,
    hasMore,
    packageDetail,
    isLoadingDetail,
    fetchList,
    loadMore,
    setTab,
    fetchOne,
    reset
  }
})
