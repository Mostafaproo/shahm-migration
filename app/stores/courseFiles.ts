import { defineStore } from 'pinia'
import { detachAction, readExtensionFilters, toMediaFile } from '~/types/media'
import type { MediaFile, MediaFilterOption, RawMediaFile, RawMetaFilter } from '~/types/media'

export type FileManagerVariant = 'student' | 'instructor'

const ENDPOINTS: Record<FileManagerVariant, string> = {
  student: 'student/courses/list-media',
  instructor: 'instructor/courses/list-media'
}

export const useCourseFilesStore = defineStore('courseFiles', () => {
  const http = useHttp()
  const nuxtApp = useNuxtApp()

  const items = ref<MediaFile[]>([])
  const filterOptions = ref<MediaFilterOption[]>([])
  const extension = ref<string | null>(null)
  const variant = ref<FileManagerVariant>('student')
  const currentCourseId = ref('')
  const busyIds = ref<Set<string>>(new Set())

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
    }>(`${locale()}/${ENDPOINTS[variant.value]}/${courseId}`, {
      query: {
        page: targetPage,
        ...(extension.value && { extension: extension.value })
      }
    })

    const doc = res?.data
    const rows = Array.isArray(doc) ? doc : (doc?.data ?? [])

    const options = readExtensionFilters(res?.meta?.filters)
    if (options.length) filterOptions.value = options

    const pagination = res?.meta?.pagination
    page.value = pagination?.current_page ?? targetPage
    totalPages.value = pagination?.total_pages ?? 1

    return rows.map(toMediaFile)
  }

  async function fetchList(courseId: string, side: FileManagerVariant = 'student') {
    variant.value = side
    currentCourseId.value = courseId
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
    await fetchList(courseId, variant.value)
  }

  function isBusy(key: string): boolean {
    return busyIds.value.has(key)
  }

  async function withBusy(key: string, fn: () => Promise<void>) {
    if (busyIds.value.has(key)) return
    busyIds.value = new Set(busyIds.value).add(key)
    try {
      await fn()
    } catch {
      // The http client already surfaced the error toast.
    } finally {
      const next = new Set(busyIds.value)
      next.delete(key)
      busyIds.value = next
    }
  }

  async function toggleActive(file: MediaFile) {
    await withBusy(`status:${file.id}`, async () => {
      await http.get(`${locale()}/instructor/courses/change-media-status/${file.id}`)
      file.active = !file.active
    })
  }

  async function detach(file: MediaFile) {
    const action = detachAction(file)
    if (!action) return
    const url = action.endpointUrl
      || `${locale()}/instructor/courses/detach-media/${currentCourseId.value}`
    await withBusy(`detach:${file.id}`, async () => {
      await http.request(url, {
        method: (action.method || 'DELETE') as 'DELETE',
        // `serializeReq` builds the JSON:API envelope from a flat
        // `{ type, id, payload }`, and it has no way to express the
        // `relationships` this endpoint needs. The document below is already
        // the final one, so serialization has to be off — running it over an
        // envelope nests it under `attributes` and drops `type`, which the
        // backend rejects with "Resource object MUST contain a type".
        serialize: false,
        body: {
          data: {
            type: 'course_media',
            id: null,
            attributes: {},
            relationships: {
              medias: { data: [{ type: 'medias', id: file.id }] }
            }
          }
        }
      })
      items.value = items.value.filter(f => f.id !== file.id)
    })
  }

  function reset() {
    items.value = []
    filterOptions.value = []
    extension.value = null
    currentCourseId.value = ''
    page.value = 1
    totalPages.value = 1
    busyIds.value = new Set()
  }

  return {
    items,
    filterOptions,
    extension,
    variant,
    page,
    totalPages,
    isLoading,
    hasMore,
    isBusy,
    fetchList,
    loadMore,
    setExtension,
    toggleActive,
    detach,
    reset
  }
})
