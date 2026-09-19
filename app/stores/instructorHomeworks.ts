import { defineStore } from 'pinia'
import {
  toHomeworkQuestionRow,
  toInstructorHomework
} from '~/types/instructorHomework'
import type {
  HomeworkQuestionRow,
  InstructorHomework,
  RawHomeworkQuestionRow,
  RawInstructorHomework
} from '~/types/instructorHomework'

const BASE = 'general-quizzes/course-homework/instructor'

/** The same hard filter the reports list uses — assignments are a separate module. */
const QUIZ_TYPES = 'quiz,final_exam'

export interface HomeworkFormPayload {
  title: string
  start_at: string
  end_at: string
  quiz_type: string
  random_question: boolean
}

export const useInstructorHomeworksStore = defineStore('instructorHomeworks', () => {
  const http = useHttp()
  const nuxtApp = useNuxtApp()

  const items = ref<InstructorHomework[]>([])
  const courseId = ref<string | null>(null)
  const page = ref(1)
  const perPage = ref(10)
  const total = ref(0)
  const totalPages = ref(1)
  const isLoading = ref(false)

  /** The one being created or edited. */
  const current = ref<InstructorHomework | null>(null)
  const isLoadingOne = ref(false)
  const isSubmitting = ref(false)

  const questions = ref<HomeworkQuestionRow[]>([])
  const isLoadingQuestions = ref(false)
  /** Keyed `delete:<id>` / `publish` so each control spins on its own. */
  const busy = ref<Set<string>>(new Set())

  function locale(): string {
    return (unref((nuxtApp.$i18n as { locale?: unknown } | undefined)?.locale) as string | undefined) ?? 'ar'
  }

  function isBusy(key: string): boolean {
    return busy.value.has(key)
  }

  async function withBusy<T>(key: string, fn: () => Promise<T>): Promise<T | undefined> {
    if (busy.value.has(key)) return
    busy.value = new Set(busy.value).add(key)
    try {
      return await fn()
    } catch {
      // The http client already surfaced the error toast.
      return undefined
    } finally {
      const next = new Set(busy.value)
      next.delete(key)
      busy.value = next
    }
  }

  // ------------------------------------------------------------------ list

  async function fetchList(targetPage = page.value) {
    isLoading.value = true
    try {
      const res = await http.get<{
        data?: RawInstructorHomework[] | {
          data?: RawInstructorHomework[]
          meta?: { pagination?: Record<string, number> }
        }
        meta?: { pagination?: Record<string, number> }
      }>(`${locale()}/${BASE}/list`, {
        query: {
          page: targetPage,
          per_page: perPage.value,
          quiz_type: QUIZ_TYPES,
          ...(courseId.value ? { course_id: courseId.value } : {})
        }
      })

      const doc = res?.data
      const rows = Array.isArray(doc) ? doc : (doc?.data ?? [])
      items.value = rows.map(toInstructorHomework)

      const pagination = (Array.isArray(doc) ? undefined : doc?.meta?.pagination)
        ?? res?.meta?.pagination
      page.value = pagination?.current_page ?? targetPage
      totalPages.value = pagination?.total_pages ?? 1
      total.value = pagination?.total ?? items.value.length
    } catch {
      items.value = []
      total.value = 0
      totalPages.value = 1
    } finally {
      isLoading.value = false
    }
  }

  async function setCourse(next: string | null) {
    courseId.value = next
    await fetchList(1)
  }

  async function setPerPage(next: number) {
    perPage.value = next
    await fetchList(1)
  }

  const setPage = (next: number) => fetchList(next)

  // ------------------------------------------------------------------ one

  async function fetchOne(id: string) {
    if (!id) return
    isLoadingOne.value = true
    try {
      const res = await http.get<{ data?: RawInstructorHomework }>(
        `${locale()}/${BASE}/view/${id}`
      )
      current.value = res?.data ? toInstructorHomework(res.data) : null
    } catch {
      current.value = null
    } finally {
      isLoadingOne.value = false
    }
  }

  /**
   * The create/edit body is a hand-built JSON:API document because the id has
   * to travel inside it on edit, so the default flat serializer will not do.
   * Create returns the new homework's id — the form redirects to its builder.
   */
  function body(payload: HomeworkFormPayload, id?: string) {
    return {
      data: {
        id: id ?? null,
        type: 'course_homework',
        attributes: { ...payload }
      }
    }
  }

  async function create(course: string, payload: HomeworkFormPayload): Promise<string | null> {
    isSubmitting.value = true
    try {
      const res = await http.post<{ data?: { id?: string | number } }>(
        `${locale()}/${BASE}/create/${course}`,
        body(payload),
        { serialize: false }
      )
      const message = serverMessage(res)
      if (message) nuxtApp.$appToast.success(message)
      const id = res?.data?.id
      return id != null ? String(id) : null
    } catch {
      return null
    } finally {
      isSubmitting.value = false
    }
  }

  async function update(
    course: string,
    homeworkId: string,
    payload: HomeworkFormPayload
  ): Promise<boolean> {
    isSubmitting.value = true
    try {
      // Note the order: homework id first, course id second.
      const res = await http.put(
        `${locale()}/${BASE}/edit/${homeworkId}/${course}`,
        body(payload, homeworkId),
        { serialize: false }
      )
      const message = serverMessage(res)
      if (message) nuxtApp.$appToast.success(message)
      return true
    } catch {
      return false
    } finally {
      isSubmitting.value = false
    }
  }

  async function remove(id: string): Promise<boolean> {
    const done = await withBusy(`delete:${id}`, async () => {
      const res = await http.delete(`${locale()}/${BASE}/delete/${id}`)
      const message = serverMessage(res)
      if (message) nuxtApp.$appToast.success(message)
      return true
    })
    return done ?? false
  }

  /** One endpoint toggles both ways — the label flips, the call does not. */
  async function publish(id: string): Promise<boolean> {
    const done = await withBusy(`publish:${id}`, async () => {
      const res = await http.post(`${locale()}/${BASE}/publish/${id}`)
      const message = serverMessage(res)
      if (message) nuxtApp.$appToast.success(message)
      return true
    })
    return done ?? false
  }

  // ------------------------------------------------------------- questions

  async function fetchQuestions(homeworkId: string) {
    if (!homeworkId) return
    isLoadingQuestions.value = true
    try {
      const res = await http.get<{
        data?: RawHomeworkQuestionRow[] | { data?: RawHomeworkQuestionRow[] }
      }>(`${locale()}/${BASE}/${homeworkId}/questions/list`)

      const doc = res?.data
      const rows = Array.isArray(doc) ? doc : (doc?.data ?? [])
      questions.value = rows.map(toHomeworkQuestionRow)
    } catch {
      questions.value = []
    } finally {
      isLoadingQuestions.value = false
    }
  }

  async function removeQuestion(homeworkId: string, questionId: string): Promise<boolean> {
    const done = await withBusy(`question:${questionId}`, async () => {
      const res = await http.delete(
        `${locale()}/${BASE}/${homeworkId}/question/delete/${questionId}`
      )
      const message = serverMessage(res)
      if (message) nuxtApp.$appToast.success(message)
      questions.value = questions.value.filter(q => q.id !== questionId)
      return true
    })
    return done ?? false
  }

  function resetOne() {
    current.value = null
    questions.value = []
  }

  return {
    items,
    courseId,
    page,
    perPage,
    total,
    totalPages,
    isLoading,
    current,
    isLoadingOne,
    isSubmitting,
    questions,
    isLoadingQuestions,
    isBusy,
    fetchList,
    setCourse,
    setPerPage,
    setPage,
    fetchOne,
    create,
    update,
    remove,
    publish,
    fetchQuestions,
    removeQuestion,
    resetOne
  }
})
