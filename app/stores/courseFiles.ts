// app/stores/courseFiles.ts
//
// "ادارة الملفات" — the course file manager, student side.
// Ported from the legacy `components/globals/shared/course-attachments.vue`
// (its `type === 'student'` branch):
//
//   GET student/courses/list-media/{courseId}?page=N&extension=<key>
//
// The file-type dropdown isn't hardcoded: the legacy reads it out of the list
// response's `meta.filters`, picking the entry named `extension`.
//
// Pagination is append-style ("load more"), matching the legacy's infinite
// scroll — just with an explicit button, which is what the rest of this
// project's signed-in lists already do.
import { defineStore } from 'pinia'
import { readExtensionFilters, toMediaFile } from '~/types/media'
import type { MediaFile, MediaFilterOption, RawMediaFile, RawMetaFilter } from '~/types/media'

const ENDPOINT = 'student/courses/list-media'

export const useCourseFilesStore = defineStore('courseFiles', () => {
  const http = useHttp()
  const nuxtApp = useNuxtApp()

  const items = ref<MediaFile[]>([])
  const filterOptions = ref<MediaFilterOption[]>([])
  /** Selected `extension` key, or null for "all types". */
  const extension = ref<string | null>(null)

  const page = ref(1)
  const totalPages = ref(1)
  const isLoading = ref(false)

  const hasMore = computed(() => page.value < totalPages.value)

  function locale(): string {
    return (unref((nuxtApp.$i18n as { locale?: unknown } | undefined)?.locale) as string | undefined) ?? 'ar'
  }

  async function load(courseId: string, targetPage: number): Promise<MediaFile[]> {
    const res = await http.get<{
      data?: RawMediaFile[] | { data?: RawMediaFile[] }
      meta?: { pagination?: { current_page?: number, total_pages?: number }, filters?: RawMetaFilter[] }
    }>(`${locale()}/${ENDPOINT}/${courseId}`, {
      query: {
        page: targetPage,
        ...(extension.value && { extension: extension.value })
      }
    })

    const doc = res?.data
    const rows = Array.isArray(doc) ? doc : (doc?.data ?? [])

    const options = readExtensionFilters(res?.meta?.filters)
    // Only overwrite when the response actually carried filters — a filtered
    // page can come back without them, and blanking the dropdown mid-use
    // would strand the student on a filter they can no longer clear.
    if (options.length) filterOptions.value = options

    const pagination = res?.meta?.pagination
    page.value = pagination?.current_page ?? targetPage
    totalPages.value = pagination?.total_pages ?? 1

    return rows.map(toMediaFile)
  }

  async function fetchList(courseId: string) {
    isLoading.value = true
    try {
      items.value = await load(courseId, 1)
    } catch {
      // The http client already surfaced the error toast.
      items.value = []
      totalPages.value = 1
    } finally {
      isLoading.value = false
    }
  }

  async function loadMore(courseId: string) {
    if (!hasMore.value || isLoading.value) return
    isLoading.value = true
    try {
      items.value = [...items.value, ...(await load(courseId, page.value + 1))]
    } catch {
      // Freeze "load more" rather than retrying forever.
      totalPages.value = page.value
    } finally {
      isLoading.value = false
    }
  }

  async function setExtension(courseId: string, next: string | null) {
    extension.value = next
    await fetchList(courseId)
  }

  function reset() {
    items.value = []
    filterOptions.value = []
    extension.value = null
    page.value = 1
    totalPages.value = 1
  }

  return {
    items,
    filterOptions,
    extension,
    page,
    totalPages,
    isLoading,
    hasMore,
    fetchList,
    loadMore,
    setExtension,
    reset
  }
})
