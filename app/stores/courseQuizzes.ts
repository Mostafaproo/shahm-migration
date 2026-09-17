import { defineStore } from 'pinia'
import { toCourseQuiz } from '~/types/courseQuiz'
import type { CourseQuiz, QuizType, RawCourseQuiz } from '~/types/courseQuiz'

const LIST_ENDPOINT = 'general-quizzes/course-homework/student/list-homeworks'
const START_ENDPOINT = 'general-quizzes/course-homework/student/start-homework'

export const PER_PAGE_OPTIONS = [5, 10, 15, 20]

export const useCourseQuizzesStore = defineStore('courseQuizzes', () => {
  const http = useHttp()
  const nuxtApp = useNuxtApp()

  const items = ref<CourseQuiz[]>([])
  const page = ref(1)
  const perPage = ref(10)
  const total = ref(0)
  const totalPages = ref(1)
  const isLoading = ref(false)
  const startingId = ref<string | null>(null)

  function locale(): string {
    return (unref((nuxtApp.$i18n as { locale?: unknown } | undefined)?.locale) as string | undefined) ?? 'ar'
  }

  async function fetchList(courseId: string, quizType: QuizType, targetPage = page.value) {
    isLoading.value = true
    try {
      const res = await http.get<{
        data?: RawCourseQuiz[] | { data?: RawCourseQuiz[] }
        meta?: { pagination?: { current_page?: number, total_pages?: number, total?: number, per_page?: number } }
      }>(`${locale()}/${LIST_ENDPOINT}`, {
        query: {
          page: targetPage,
          per_page: perPage.value,
          course_id: courseId,
          quiz_type: quizType
        }
      })

      // Collections come back double-nested; tolerate a bare array too.
      const doc = res?.data
      const rows = Array.isArray(doc) ? doc : (doc?.data ?? [])
      items.value = rows.map(toCourseQuiz)

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

  async function setPage(courseId: string, quizType: QuizType, next: number) {
    await fetchList(courseId, quizType, next)
  }

  async function setPerPage(courseId: string, quizType: QuizType, next: number) {
    perPage.value = next
    // Legacy re-reads from page 1 whenever the page size changes.
    await fetchList(courseId, quizType, 1)
  }

  async function startQuiz(quizId: string): Promise<void> {
    startingId.value = quizId
    try {
      await http.post(`${locale()}/${START_ENDPOINT}/${quizId}`, undefined, { preventToast: true })
    } catch {
      // Intentionally ignored, same as the legacy.
    } finally {
      startingId.value = null
    }
  }

  function reset() {
    items.value = []
    page.value = 1
    total.value = 0
    totalPages.value = 1
  }

  return {
    items,
    page,
    perPage,
    total,
    totalPages,
    isLoading,
    startingId,
    fetchList,
    setPage,
    setPerPage,
    startQuiz,
    reset
  }
})
