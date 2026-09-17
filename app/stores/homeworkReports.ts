import { defineStore } from 'pinia'
import {
  toHomeworkReport,
  toReportCourseOption,
  toReportQuestionLink
} from '~/types/homeworkReport'
import type {
  HomeworkReport,
  RawHomeworkReport,
  RawReportCourseOption,
  RawReportQuestionLink,
  ReportCourseOption,
  ReportQuestionLink
} from '~/types/homeworkReport'
import type { HomeworkQuestion } from '~/types/homeworkQuestion'

const LIST_ENDPOINT = 'general-quizzes/course-homework/student/list-homeworks/report'
const FEEDBACK_ENDPOINT = 'general-quizzes/course-homework/student/feedback'

export const useHomeworkReportsStore = defineStore('homeworkReports', () => {
  const http = useHttp()
  const nuxtApp = useNuxtApp()

  // --- List
  const items = ref<HomeworkReport[]>([])
  const courseOptions = ref<ReportCourseOption[]>([])
  const courseId = ref<string | null>(null)
  const page = ref(1)
  const perPage = ref(10)
  const total = ref(0)
  const totalPages = ref(1)
  const isLoading = ref(false)

  // --- Feedback
  const questionLinks = ref<ReportQuestionLink[]>([])
  const activeIndex = ref(0)
  const question = ref<HomeworkQuestion | null>(null)
  const isLoadingFeedback = ref(false)

  function locale(): string {
    return (unref((nuxtApp.$i18n as { locale?: unknown } | undefined)?.locale) as string | undefined) ?? 'ar'
  }

  async function fetchList(targetPage = page.value) {
    isLoading.value = true
    try {
      const res = await http.get<{
        data?: RawHomeworkReport[] | { data?: RawHomeworkReport[], meta?: { pagination?: Record<string, number> } }
        meta?: ({ data?: RawReportCourseOption[] } | undefined)[] | { pagination?: Record<string, number> }
      }>(`${locale()}/${LIST_ENDPOINT}`, {
        query: {
          page: targetPage,
          per_page: perPage.value,
          ...(courseId.value ? { course_id: courseId.value } : {})
        }
      })

      const doc = res?.data
      const rows = Array.isArray(doc) ? doc : (doc?.data ?? [])
      items.value = rows.map(toHomeworkReport)

      // Legacy reads the course filter from `meta[0].data` — the list meta is
      // an ARRAY here, unlike most endpoints on this API.
      const meta = res?.meta
      if (Array.isArray(meta)) {
        const options = meta[0]?.data
        if (options?.length) courseOptions.value = options.map(toReportCourseOption)
      }

      const pagination = (Array.isArray(doc) ? undefined : doc?.meta?.pagination)
        ?? (Array.isArray(meta) ? undefined : meta?.pagination)
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

  /** Both filters reset to page 1, exactly like the legacy. */
  async function setCourse(next: string | null) {
    courseId.value = next
    await fetchList(1)
  }

  async function setPerPage(next: number) {
    perPage.value = next
    await fetchList(1)
  }

  const setPage = (next: number) => fetchList(next)

  // --- Feedback
  async function fetchQuestion(index: number) {
    const link = questionLinks.value[index]
    if (!link?.endpointUrl) return

    isLoadingFeedback.value = true
    try {
      const res = await http.get<{
        data?: {
          questionData?: { data?: HomeworkQuestion }
          description?: string
          question_slug?: string
        }
      }>(link.endpointUrl)

      const body = res?.data
      const raw = body?.questionData?.data
      if (!raw) return

      // Legacy resolves the type from three places and backfills `description`
      // from the wrapper when the question itself has none.
      question.value = {
        ...raw,
        description: raw.description || body?.description,
        question_type: raw.question_type ?? (body?.question_slug as HomeworkQuestion['question_type'])
      }
      activeIndex.value = index
    } catch {
      question.value = null
    } finally {
      isLoadingFeedback.value = false
    }
  }

  async function fetchFeedback(homeworkId: string) {
    isLoadingFeedback.value = true
    try {
      const res = await http.get<{
        data?: { questions_pagination?: { data?: RawReportQuestionLink[] } }
      }>(`${locale()}/${FEEDBACK_ENDPOINT}/${homeworkId}`)

      questionLinks.value = (res?.data?.questions_pagination?.data ?? []).map(toReportQuestionLink)
      activeIndex.value = 0
      if (questionLinks.value.length) await fetchQuestion(0)
    } catch {
      questionLinks.value = []
      question.value = null
    } finally {
      isLoadingFeedback.value = false
    }
  }

  function resetFeedback() {
    questionLinks.value = []
    question.value = null
    activeIndex.value = 0
  }

  return {
    items,
    courseOptions,
    courseId,
    page,
    perPage,
    total,
    totalPages,
    isLoading,
    questionLinks,
    activeIndex,
    question,
    isLoadingFeedback,
    fetchList,
    setCourse,
    setPerPage,
    setPage,
    fetchFeedback,
    fetchQuestion,
    resetFeedback
  }
})
