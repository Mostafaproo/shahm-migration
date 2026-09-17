// app/stores/studentCourses.ts
//
// Dashboard courses page — ported from the legacy `pages/courses/index.vue`
// + `store/courses`:
//   GET student/courses?subscribed=0|1&page=N&paginate=1&per_page=15
//     &search_key&instructor_id(csv)&price(asc|desc)&rate(asc|desc)
//     &educational_system_id
//   GET look-up?include=price,instructors,rate   (filter options, public)
//   GET look-up?include=educationalSystems       (system chips, public)
// Paging appends like the legacy infinite scroll; page 1 replaces.
//
// Client-only fetching, same reasoning as the notifications store: per-user
// data behind auth, and it keeps SSR/client parity out of the picture.
import { defineStore } from 'pinia'
import { toEnrolledCourse, toLookupOption, emptyCourseFilters } from '~/types/studentCourse'
import type {
  CourseFilters,
  EnrolledCourse,
  LookupOption,
  RawEnrolledCourse,
  RawLookupOption
} from '~/types/studentCourse'

export type CoursesTab = 'new' | 'enrolled'

const PER_PAGE = 15

interface RawListBody {
  data?: {
    data?: RawEnrolledCourse[]
    meta?: { pagination?: { current_page?: number, total_pages?: number } }
  }
}

interface RawLookupBody {
  data?: {
    data?: {
      instructors?: { data?: RawLookupOption[] }
      price?: { data?: RawLookupOption[] }
      rate?: { data?: RawLookupOption[] }
      educationalSystems?: { data?: RawLookupOption[] }
    }[]
  }
}

export const useStudentCoursesStore = defineStore('studentCourses', () => {
  const http = useHttp()
  const nuxtApp = useNuxtApp()

  const tab = ref<CoursesTab>('new')
  const items = ref<EnrolledCourse[]>([])
  const currentPage = ref(1)
  const totalPages = ref(1)
  const isLoading = ref(false)

  const filters = ref<CourseFilters>(emptyCourseFilters())

  const instructors = ref<LookupOption[]>([])
  const priceSorts = ref<LookupOption[]>([])
  const rateSorts = ref<LookupOption[]>([])
  const educationalSystems = ref<LookupOption[]>([])

  const hasMore = computed(() => currentPage.value < totalPages.value)

  function locale(): string {
    return (unref((nuxtApp.$i18n as { locale?: unknown } | undefined)?.locale) as string | undefined) ?? 'ar'
  }

  function buildQuery(page: number): Record<string, unknown> {
    const f = filters.value
    return {
      subscribed: tab.value === 'enrolled' ? 1 : 0,
      page,
      paginate: 1,
      per_page: PER_PAGE,
      ...(f.searchKey ? { search_key: f.searchKey } : {}),
      ...(f.instructorIds.length ? { instructor_id: f.instructorIds.join() } : {}),
      ...(f.price ? { price: f.price } : {}),
      ...(f.rate ? { rate: f.rate } : {}),
      ...(f.educationalSystemId ? { educational_system_id: f.educationalSystemId } : {})
    }
  }

  async function load(page: number) {
    isLoading.value = true
    try {
      const res = await http.get<RawListBody>(`${locale()}/student/courses`, {
        query: buildQuery(page)
      })
      const pagination = res?.data?.meta?.pagination
      currentPage.value = pagination?.current_page ?? page
      totalPages.value = pagination?.total_pages ?? 1

      const rows = (res?.data?.data ?? []).map(toEnrolledCourse)
      items.value = page === 1 ? rows : [...items.value, ...rows]
    } catch {
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

  async function setTab(next: CoursesTab) {
    if (next === tab.value) return
    tab.value = next
    // Legacy resets the filters whenever the tab changes.
    filters.value = emptyCourseFilters()
    items.value = []
    currentPage.value = 1
    totalPages.value = 1

    await fetchList()
  }

  async function applyFilters(next: CourseFilters) {
    filters.value = next
    await fetchList()
  }

  async function resetFilters() {
    filters.value = emptyCourseFilters()
    await fetchList()
  }

  async function fetchLookups() {
    try {
      const [options, systems] = await Promise.all([
        http.get<RawLookupBody>(`${locale()}/look-up`, { query: { include: 'price,instructors,rate' } }),
        http.get<RawLookupBody>(`${locale()}/look-up`, { query: { include: 'educationalSystems' } })
      ])

      const root = options?.data?.data?.[0]
      instructors.value = (root?.instructors?.data ?? []).map(toLookupOption)
      priceSorts.value = (root?.price?.data ?? []).map(toLookupOption)
      rateSorts.value = (root?.rate?.data ?? []).map(toLookupOption)
      educationalSystems.value = (systems?.data?.data?.[0]?.educationalSystems?.data ?? []).map(toLookupOption)
    } catch {
      // Filters simply render empty if the lookups can't be reached.
    }
  }

  return {
    tab,
    items,
    isLoading,
    hasMore,
    filters,
    instructors,
    priceSorts,
    rateSorts,
    educationalSystems,
    fetchList,
    loadMore,
    setTab,
    applyFilters,
    resetFilters,
    fetchLookups
  }
})
