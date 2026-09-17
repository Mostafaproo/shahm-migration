import { defineStore } from 'pinia'
import { buildAnswerPayload, seedAnswer } from '~/types/homeworkQuestion'
import type {
  AnswerValue,
  HomeworkQuestion,
  QuestionType,
  TrueFalseWithCorrectAnswer
} from '~/types/homeworkQuestion'

const BASE = 'general-quizzes/course-homework/student'
const FINISH_BASE = 'general-quizzes/homework/student'

interface RawAttemptRow {
  id?: string | number
  type?: string
  questions?: { data?: { questionData?: { data?: HomeworkQuestion } } }
}

interface RawAttemptEnvelope {
  data?: RawAttemptRow[] | { data?: RawAttemptRow[] }
  meta?: { pagination?: { current_page?: number, total_pages?: number } }
}

export const useHomeworkAttemptStore = defineStore('homeworkAttempt', () => {
  const http = useHttp()
  const nuxtApp = useNuxtApp()

  /** The homework resource id — what post-answer keys its payload on. */
  const homeworkResourceId = ref<string>('')
  const question = ref<HomeworkQuestion | null>(null)
  const answer = ref<AnswerValue | TrueFalseWithCorrectAnswer>(null)

  const currentPage = ref(1)
  const totalPages = ref(1)

  const isLoading = ref(false)
  const isSubmitting = ref(false)
  const isFinishing = ref(false)

  const questionType = computed<QuestionType | null>(() => question.value?.question_type ?? null)

  function locale(): string {
    return (unref((nuxtApp.$i18n as { locale?: unknown } | undefined)?.locale) as string | undefined) ?? 'ar'
  }

  // --- localStorage: which questions this attempt has already answered.
  // The legacy uses it so a "retry" shows a clean form for questions the
  // student has not re-answered yet, instead of the previous attempt's picks.
  function answeredKey(homeworkId: string) {
    return `answered_questions_${homeworkId}`
  }

  function readAnswered(homeworkId: string): string[] {
    if (!import.meta.client) return []
    try {
      const raw = localStorage.getItem(answeredKey(homeworkId))
      const parsed = raw ? JSON.parse(raw) : []
      return Array.isArray(parsed) ? parsed : []
    } catch {
      return []
    }
  }

  function rememberAnswered(homeworkId: string, questionId: string) {
    if (!import.meta.client || !questionId) return
    const list = readAnswered(homeworkId)
    if (list.includes(questionId)) return
    list.push(questionId)
    try {
      localStorage.setItem(answeredKey(homeworkId), JSON.stringify(list))
    } catch {
      // A full or blocked storage must not break answering.
    }
  }

  /** Legacy: on a retry, blank out any question not yet re-answered. */
  function applyRetry(raw: HomeworkQuestion, homeworkId: string, isRetry: boolean): HomeworkQuestion {
    if (!isRetry || readAnswered(homeworkId).includes(raw.id)) return raw
    return { ...raw, is_answered: false, selected_options: [], student_answer: [] }
  }

  /** The empty value each type's input binds to before anything is picked. */
  function defaultAnswer(type: QuestionType): AnswerValue | TrueFalseWithCorrectAnswer {
    switch (type) {
      case 'multiple_choice':
      case 'drag_drop_text':
      case 'drag_drop_image':
        return []
      case 'true_false_with_correct':
        return { value: null, optionId: null }
      default:
        return null
    }
  }

  function readEnvelope(res: RawAttemptEnvelope, homeworkId: string, isRetry: boolean) {
    const doc = res?.data
    const rows = Array.isArray(doc) ? doc : (doc?.data ?? [])
    const row = rows[0]
    if (row) {
      homeworkResourceId.value = String(row.id ?? '')
      const raw = row.questions?.data?.questionData?.data
      if (raw) {
        const next = applyRetry(raw, homeworkId, isRetry)
        question.value = next
        answer.value = seedAnswer(next) ?? defaultAnswer(next.question_type)
      }
    }

    const pagination = res?.meta?.pagination
    if (pagination) {
      currentPage.value = pagination.current_page ?? currentPage.value
      totalPages.value = pagination.total_pages ?? totalPages.value
    }
  }

  async function start(homeworkId: string, isRetry: boolean) {
    isLoading.value = true
    try {
      const res = await http.post<RawAttemptEnvelope>(
        `${locale()}/${BASE}/start-homework/${homeworkId}`,
        undefined,
        { preventToast: true }
      )
      readEnvelope(res, homeworkId, isRetry)
    } catch {
      question.value = null
    } finally {
      isLoading.value = false
    }
  }

  async function goToPage(homeworkId: string, page: number, isRetry: boolean) {
    if (page < 1 || page > totalPages.value || isLoading.value) return
    isLoading.value = true
    try {
      const res = await http.get<RawAttemptEnvelope>(
        `${locale()}/${BASE}/${homeworkId}/questions`,
        { query: { page } }
      )
      readEnvelope(res, homeworkId, isRetry)
      currentPage.value = page
    } finally {
      isLoading.value = false
    }
  }

  /** Legacy `submitAnswer` — the payload's `data[0].id` is the HOMEWORK id. */
  async function submitAnswer(homeworkId: string): Promise<boolean> {
    const type = questionType.value
    if (!type) return false

    isSubmitting.value = true
    try {
      const body = buildAnswerPayload(type, answer.value)
      if (body.data[0]) body.data[0].id = homeworkResourceId.value

      const res = await http.post<{ meta?: { message?: string } }>(
        `${locale()}/${BASE}/post-answer/${homeworkId}`,
        body,
        { serialize: false }
      )
      if (res?.meta?.message) nuxtApp.$appToast.success(res.meta.message)

      if (question.value?.id) rememberAnswered(homeworkId, question.value.id)
      return true
    } catch {
      // The http client already surfaced the error toast.
      return false
    } finally {
      isSubmitting.value = false
    }
  }

  async function finish(homeworkId: string): Promise<boolean> {
    isFinishing.value = true
    try {
      await http.post(`${locale()}/${FINISH_BASE}/finish-homework/${homeworkId}`, undefined, {
        query: { force_finish: true }
      })
      if (import.meta.client) {
        localStorage.removeItem(answeredKey(homeworkId))
        localStorage.removeItem(`homework_state_${homeworkId}`)
      }
      return true
    } catch {
      return false
    } finally {
      isFinishing.value = false
    }
  }

  function reset() {
    homeworkResourceId.value = ''
    question.value = null
    answer.value = null
    currentPage.value = 1
    totalPages.value = 1
  }

  return {
    homeworkResourceId,
    question,
    answer,
    questionType,
    currentPage,
    totalPages,
    isLoading,
    isSubmitting,
    isFinishing,
    start,
    goToPage,
    submitAnswer,
    finish,
    reset
  }
})
