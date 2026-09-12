// app/stores/courses.ts
//
// Public course catalog — same LMS-monorepo pattern as every other domain
// store: spread `useDynamicCrud<T>()` rather than hand-rolling fetch/pagination
// state. Backs the `/courses` listing page. The landing page's featured-
// courses section fetches independently (see components/courses/
// FeaturedCourses.vue) — it needs an unpaginated top-N slice, and sharing
// this store's single `items` ref between the two would let one page's
// fetch stomp the other's.
//
// `crud.items` stays RAW (useDynamicCrud is generic over `T`, but it's the
// one writing to `items.value` internally after each fetch — there's no way
// to make that write and a follow-up normalization atomic). `courses` is a
// computed derived view instead, so it's never observably out of sync with
// whatever `crud.items` currently holds.
import { defineStore } from 'pinia'
import { toCourse } from '~/types/course'
import type { RawCourse } from '~/types/course'

const COURSES_ENDPOINT = 'landing-page/courses'

export const useCoursesStore = defineStore('courses', () => {
  const crud = useDynamicCrud<RawCourse & { id: string }>()
  const nuxtApp = useNuxtApp()

  const courses = computed(() => crud.items.value.map(toCourse))

  /** The public `/courses` listing — paginated, filterable by search. */
  async function fetchList() {
    // Locale-prefixed, same as every other endpoint on this tenant's API
    // (confirmed live) — not `useI18n()`, which throws when called from a
    // Pinia action reached across an async boundary (see stores/auth.ts).
    const locale = (unref((nuxtApp.$i18n as { locale?: unknown } | undefined)?.locale) as string | undefined) ?? 'ar'
    // Legacy sends the search term as `search_key`, not this project's
    // default `search` param name — confirmed in shaham-go-fe's
    // `pages/home/courses/index.vue`.
    await crud.fetchList(`${locale}/${COURSES_ENDPOINT}`, {
      query: { paginate: 1 },
      params: { search: 'search_key' }
    })
  }

  return { ...crud, courses, fetchList }
})
