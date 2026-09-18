import { defineStore } from 'pinia'
import {
  toExamListRow,
  toExamQuestions,
  toExamResult,
  toExamSettings,
  toReviewQuestions
} from '~/types/computerizedExam'
import type {
  ExamListRow,
  ExamQuestion,
  ExamResult,
  ExamSettings,
  ExamType,
  RawExamListRow,
  RawExamResult,
  RawExamSettings,
  RawStartExamResponse
} from '~/types/computerizedExam'

const BASE = 'student/computerized-exam'
const STORAGE_KEY = 'shaham_computerized_attempt'

interface StoredAttempt {
  examId: string
  examType: ExamType
  /** Epoch seconds — the countdown is derived from this, not stored raw. */
  startedAt: number
  enteredVerbal: boolean
  ended: boolean
}

export const useComputerizedExamStore = defineStore('computerizedExam', () => {
  const http = useHttp()
  const nuxtApp = useNuxtApp()

  // --- listing + settings
  const settings = ref<ExamSettings | null>(null)
  const exams = ref<ExamListRow[]>([])
  const page = ref(1)
  const totalPages = ref(1)
  const total = ref(0)
  const isLoadingList = ref(false)

  // --- active attempt
  const examId = ref<string>('')
  const examType = ref<ExamType | null>(null)
  const questions = ref<ExamQuestion[]>([])
  const currentIndex = ref(0)
  const enteredVerbal = ref(false)
  const startedAt = ref(0)
  const isBusy = ref(false)

  // --- result
  const result = ref<ExamResult | null>(null)
  const isLoadingResult = ref(false)

  function locale(): string {
    return (unref((nuxtApp.$i18n as { locale?: unknown } | undefined)?.locale) as string | undefined) ?? 'ar'
  }

  const currentQuestion = computed<ExamQuestion | null>(() => questions.value[currentIndex.value] ?? null)
  const totalQuestions = computed(() => questions.value.length)
  const answeredCount = computed(() => questions.value.filter(q => q.isAnswered).length)
  const markedCount = computed(() => questions.value.filter(q => q.isMarked).length)

  /** Index of the first verbal question, or -1 when the exam has no verbal part. */
  const verbalStartIndex = computed(() => questions.value.findIndex(q => q.section === 'verbal'))

  /**
   * Legacy rule: in a combined exam the verbal section is one-way — once the
   * student crosses into it they cannot step back into the quantitative part.
   */
  const canGoBack = computed(() => {
    if (currentIndex.value <= 0) return false
    if (!enteredVerbal.value || verbalStartIndex.value < 0) return true
    return currentIndex.value > verbalStartIndex.value
  })

  // --- persistence
  function persist() {
    if (!import.meta.client || !examId.value || !examType.value) return
    const payload: StoredAttempt = {
      examId: examId.value,
      examType: examType.value,
      startedAt: startedAt.value,
      enteredVerbal: enteredVerbal.value,
      ended: false
    }
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(payload))
    } catch {
      // A blocked storage only costs resumability, not the exam itself.
    }
  }

  function readStored(): StoredAttempt | null {
    if (!import.meta.client) return null
    try {
      const raw = localStorage.getItem(STORAGE_KEY)
      return raw ? (JSON.parse(raw) as StoredAttempt) : null
    } catch {
      return null
    }
  }

  function clearStored() {
    if (!import.meta.client) return
    try {
      localStorage.removeItem(STORAGE_KEY)
    } catch { /* ignore */ }
  }

  // --- settings + list
  async function fetchSettings() {
    try {
      const res = await http.get<{ data?: RawExamSettings[] | { data?: RawExamSettings[] } }>(
        `${locale()}/${BASE}/settings`
      )
      const doc = res?.data
      const rows = Array.isArray(doc) ? doc : (doc?.data ?? [])
      settings.value = rows[0] ? toExamSettings(rows[0]) : null
    } catch {
      settings.value = null
    }
  }

  async function fetchExams(targetPage = page.value) {
    isLoadingList.value = true
    try {
      const res = await http.get<{
        data?: RawExamListRow[] | { data?: RawExamListRow[] }
        meta?: { pagination?: { current_page?: number, total_pages?: number, total?: number } }
      }>(`${locale()}/${BASE}/list-exams`, { query: { page: targetPage } })

      const doc = res?.data
      const rows = Array.isArray(doc) ? doc : (doc?.data ?? [])
      exams.value = rows.map(toExamListRow)

      const pagination = res?.meta?.pagination
      page.value = pagination?.current_page ?? targetPage
      totalPages.value = pagination?.total_pages ?? 1
      total.value = pagination?.total ?? exams.value.length
    } catch {
      exams.value = []
      totalPages.value = 1
      total.value = 0
    } finally {
      isLoadingList.value = false
    }
  }

  // --- attempt
  async function start(type: ExamType): Promise<boolean> {
    isBusy.value = true
    try {
      const res = await http.post<{ data?: RawStartExamResponse }>(`${locale()}/${BASE}/start`, {
        type: 'computerized_exam',
        id: 'null',
        payload: { exam_type: type }
      })

      const body = res?.data
      if (!body) return false

      const rows = toExamQuestions(body)
      if (!rows.length) return false

      examId.value = String(body.id ?? '')
      examType.value = type
      questions.value = rows
      currentIndex.value = 0
      enteredVerbal.value = rows[0]?.section === 'verbal'
      startedAt.value = Math.floor(Date.now() / 1000)
      persist()
      return true
    } catch {
      return false
    } finally {
      isBusy.value = false
    }
  }

  /** Records the pick for the CURRENT question. Legacy posts on navigation. */
  async function submitAnswer(optionId: number): Promise<void> {
    const question = currentQuestion.value
    if (!question || !examId.value) return
    try {
      await http.post(`${locale()}/${BASE}/answer/${examId.value}`, {
        type: 'computerized_exam_questions',
        id: 'null',
        payload: {
          computerized_question_id: question.questionId,
          computerized_question_option_id: optionId
        }
      }, { preventToast: true })
      question.isAnswered = true
      question.selectedOptionId = optionId
    } catch {
      // Swallowed like the legacy — a failed save must not block navigation.
    }
  }

  /** "Mark for review" — the legacy's draft flag, toggled optimistically. */
  async function toggleMark(index = currentIndex.value): Promise<void> {
    const question = questions.value[index]
    if (!question) return
    const next = !question.isMarked
    question.isMarked = next
    try {
      await http.post(`${locale()}/${BASE}/draft-answer/${question.questionId}`, undefined, {
        preventToast: true
      })
    } catch {
      question.isMarked = !next
    }
  }

  function goTo(index: number) {
    if (index < 0 || index >= questions.value.length) return
    // Crossing into the verbal section is one-way; remember it happened.
    if (verbalStartIndex.value >= 0 && index >= verbalStartIndex.value && !enteredVerbal.value) {
      enteredVerbal.value = true
      persist()
    }
    currentIndex.value = index
  }

  async function end(): Promise<boolean> {
    if (!examId.value || !examType.value) return false
    isBusy.value = true
    try {
      await http.post(`${locale()}/${BASE}/end/${examId.value}`, {
        type: 'computerized_exam',
        id: 'null',
        payload: { exam_type: examType.value }
      })
      clearStored()
      return true
    } catch {
      return false
    } finally {
      isBusy.value = false
    }
  }

  /**
   * Review mode — rebuilds the question list from a FINISHED attempt.
   * `exam-details` returns the same questions under `answers`, with the
   * student's pick and the model answer attached, so the runner can replay it
   * read-only.
   */
  async function loadReview(id: string): Promise<boolean> {
    isBusy.value = true
    try {
      const res = await http.get<{
        data?: { type?: string, answers?: { data?: unknown[] } }
      }>(`${locale()}/${BASE}/exam-details/${id}`)

      const body = res?.data
      if (!body) return false

      examId.value = id
      examType.value = (body.type as ExamType) ?? null
      questions.value = toReviewQuestions(body as Parameters<typeof toReviewQuestions>[0])
      currentIndex.value = 0
      return questions.value.length > 0
    } catch {
      questions.value = []
      return false
    } finally {
      isBusy.value = false
    }
  }

  async function fetchResult(id: string) {
    isLoadingResult.value = true
    try {
      const res = await http.get<{ data?: RawExamResult }>(`${locale()}/${BASE}/exam-details/${id}`)
      result.value = res?.data ? toExamResult(res.data) : null
    } catch {
      result.value = null
    } finally {
      isLoadingResult.value = false
    }
  }

  /**
   * Re-attaches to an attempt after a reload. Returns false when there's
   * nothing to resume — the page then sends the student back to the start.
   */
  function resume(): boolean {
    const stored = readStored()
    if (!stored?.examId || stored.ended) return false
    examId.value = stored.examId
    examType.value = stored.examType
    enteredVerbal.value = stored.enteredVerbal
    startedAt.value = stored.startedAt
    // Questions are NOT persisted — they come back from exam-details.
    return true
  }

  /** Seconds left, from the attempt's start and the tenant's configured time. */
  function remainingSeconds(): number | null {
    const minutes = settings.value?.durationMinutes
    if (!minutes || !startedAt.value) return null
    const elapsed = Math.floor(Date.now() / 1000) - startedAt.value
    return Math.max(0, minutes * 60 - elapsed)
  }

  function resetAttempt() {
    examId.value = ''
    examType.value = null
    questions.value = []
    currentIndex.value = 0
    enteredVerbal.value = false
    startedAt.value = 0
    clearStored()
  }

  return {
    settings,
    exams,
    page,
    totalPages,
    total,
    isLoadingList,
    examId,
    examType,
    questions,
    currentIndex,
    currentQuestion,
    totalQuestions,
    answeredCount,
    markedCount,
    verbalStartIndex,
    canGoBack,
    isBusy,
    result,
    isLoadingResult,
    fetchSettings,
    fetchExams,
    start,
    submitAnswer,
    toggleMark,
    goTo,
    end,
    fetchResult,
    loadReview,
    resume,
    remainingSeconds,
    resetAttempt
  }
})
