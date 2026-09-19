import { defineStore } from 'pinia'
import { toExamQuestion } from '~/types/instructorExamQuestion'
import type {
  ExamQuestion,
  ExamQuestionOption,
  RawExamQuestion
} from '~/types/instructorExamQuestion'

const BASE = 'instructor/computerized-exam-question'

export interface ExamQuestionPayload {
  questionType: string
  title: string
  description: string
  correctAnswerDescription: string
  instruction: string
  isActive: boolean
  options: ExamQuestionOption[]
}

export const useInstructorExamQuestionsStore = defineStore('instructorExamQuestions', () => {
  const http = useHttp()
  const nuxtApp = useNuxtApp()

  const items = ref<ExamQuestion[]>([])
  const questionType = ref<string | null>(null)
  const page = ref(1)
  const perPage = ref(10)
  const total = ref(0)
  const totalPages = ref(1)
  const isLoading = ref(false)

  const isFeatureAvailable = ref(true)

  const current = ref<ExamQuestion | null>(null)
  const isLoadingOne = ref(false)
  const isSubmitting = ref(false)
  const togglingId = ref<string | null>(null)

  function locale(): string {
    return (unref((nuxtApp.$i18n as { locale?: unknown } | undefined)?.locale) as string | undefined) ?? 'ar'
  }

  async function fetchSettings() {
    try {
      const res = await http.get<{ data?: { is_feature_available?: boolean } | { is_feature_available?: boolean }[] }>(
        `${locale()}/instructor/computerized-exam-settings`
      )
      const doc = res?.data
      const row = Array.isArray(doc) ? doc[0] : doc
      // Only an explicit `false` hides the module; a missing key is not a no.
      if (row && row.is_feature_available != null) {
        isFeatureAvailable.value = Boolean(row.is_feature_available)
      }
    } catch {
      // A failed settings call must not lock the instructor out of their bank.
    }
  }

  async function fetchList(targetPage = page.value) {
    isLoading.value = true
    try {
      const res = await http.get<{
        data?: RawExamQuestion[] | {
          data?: RawExamQuestion[]
          meta?: { pagination?: Record<string, number> }
        }
        meta?: { pagination?: Record<string, number> }
      }>(`${locale()}/${BASE}`, {
        query: {
          page: targetPage,
          per_page: perPage.value,
          // Dropped entirely when cleared, as in the legacy.
          ...(questionType.value ? { question_type: questionType.value } : {})
        }
      })

      const doc = res?.data
      const rows = Array.isArray(doc) ? doc : (doc?.data ?? [])
      items.value = rows.map(toExamQuestion)

      const pagination = (Array.isArray(doc) ? undefined : doc?.meta?.pagination)
        ?? res?.meta?.pagination
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

  async function setQuestionType(next: string | null) {
    questionType.value = next
    await fetchList(1)
  }

  async function setPerPage(next: number) {
    perPage.value = next
    await fetchList(1)
  }

  const setPage = (next: number) => fetchList(next)

  async function fetchOne(id: string) {
    if (!id) return
    isLoadingOne.value = true
    try {
      const res = await http.get<{ data?: RawExamQuestion | RawExamQuestion[] }>(
        `${locale()}/${BASE}/${id}`
      )
      // The legacy tolerates this endpoint answering with a one-item array.
      const doc = res?.data
      const row = Array.isArray(doc) ? doc[0] : doc
      current.value = row ? toExamQuestion(row) : null
    } catch {
      current.value = null
    } finally {
      isLoadingOne.value = false
    }
  }

  function body(payload: ExamQuestionPayload, id: string | null) {
    return {
      data: {
        type: 'computerized_exam_questions',
        id,
        attributes: {
          question_type: payload.questionType,
          question_title: payload.title,
          question_description: payload.description,
          correct_answer_description: payload.correctAnswerDescription,
          question_instruction: payload.instruction,
          is_active: payload.isActive
        },
        relationships: {
          options: {
            data: { type: 'computerized_exam_question_options', id: 'new' }
          }
        }
      },
      included: [{
        type: 'computerized_exam_question_options',
        id: 'new',
        attributes: {
          data: payload.options.map(option => ({
            ...(option.id ? { id: option.id } : {}),
            description: option.option,
            is_correct: option.isCorrect
          }))
        }
      }]
    }
  }

  async function create(payload: ExamQuestionPayload): Promise<boolean> {
    isSubmitting.value = true
    try {
      const res = await http.post(`${locale()}/${BASE}`, body(payload, null), { serialize: false })
      const message = serverMessage(res)
      if (message) nuxtApp.$appToast.success(message)
      return true
    } catch {
      return false
    } finally {
      isSubmitting.value = false
    }
  }

  async function update(id: string, payload: ExamQuestionPayload): Promise<boolean> {
    isSubmitting.value = true
    try {
      const res = await http.put(`${locale()}/${BASE}/${id}`, body(payload, id), { serialize: false })
      const message = serverMessage(res)
      if (message) nuxtApp.$appToast.success(message)
      return true
    } catch {
      return false
    } finally {
      isSubmitting.value = false
    }
  }

  /** Show/hide a question from the exam pool. Flips optimistically. */
  async function toggleActive(question: ExamQuestion): Promise<void> {
    togglingId.value = question.id
    const next = !question.isActive
    question.isActive = next
    try {
      const res = await http.put(`${locale()}/${BASE}/${question.id}/toggle-active`)
      const message = serverMessage(res)
      if (message) nuxtApp.$appToast.success(message)
    } catch {
      question.isActive = !next
    } finally {
      togglingId.value = null
    }
  }

  function resetOne() {
    current.value = null
  }

  return {
    items,
    questionType,
    page,
    perPage,
    total,
    totalPages,
    isLoading,
    isFeatureAvailable,
    current,
    isLoadingOne,
    isSubmitting,
    togglingId,
    fetchSettings,
    fetchList,
    setQuestionType,
    setPerPage,
    setPage,
    fetchOne,
    create,
    update,
    toggleActive,
    resetOne
  }
})
