import { defineStore } from 'pinia'
import { toStudentCourseDetail, toSessionFile } from '~/types/studentCourseDetail'
import type {
  RawSessionFile,
  RawStudentCourseDetail,
  SessionFile,
  StudentCourseDetail
} from '~/types/studentCourseDetail'

export const useStudentCourseDetailStore = defineStore('studentCourseDetail', () => {
  const http = useHttp()
  const nuxtApp = useNuxtApp()

  const course = ref<StudentCourseDetail | null>(null)
  const isLoading = ref(false)

  const sessionFiles = ref<SessionFile[]>([])
  const isLoadingFiles = ref(false)
  const isRating = ref(false)

  function locale(): string {
    return (unref((nuxtApp.$i18n as { locale?: unknown } | undefined)?.locale) as string | undefined) ?? 'ar'
  }

  async function fetchCourse(id: string) {
    isLoading.value = true
    try {
      const res = await http.get<{ data?: RawStudentCourseDetail }>(`${locale()}/student/courses/${id}`)
      course.value = res?.data ? toStudentCourseDetail(res.data) : null
    } catch {
      course.value = null
    } finally {
      isLoading.value = false
    }
  }

  async function fetchSessionFiles(sessionId: string) {
    isLoadingFiles.value = true
    sessionFiles.value = []
    try {
      const res = await http.get<{ data?: { data?: RawSessionFile[] } }>(
        `${locale()}/student/courses/list-session-media/${sessionId}`
      )
      sessionFiles.value = (res?.data?.data ?? []).map(toSessionFile)
    } catch {
      sessionFiles.value = []
    } finally {
      isLoadingFiles.value = false
    }
  }

  /**
   * Legacy `saveProgress`: percentage watched, keyed by the *session* id (not
   * the recording's). Fire-and-forget — a failed ping must never break playback.
   */
  async function saveProgress(sessionId: string, percentage: number) {
    if (!sessionId || percentage <= 0) return
    try {
      await http.post(`${locale()}/student/courses/${sessionId}/progress`, {
        type: 'user',
        id: 'null',
        payload: { progress: percentage }
      }, { preventToast: true })
    } catch {
      // Progress is best-effort; the student keeps watching either way.
    }
  }

  /**
   * Legacy `rateCourse` — `POST student/courses/rate/{courseId}`.
   * On success it re-reads the course, which is enough here: unlike the legacy
   * (which also called `getCourseRatings`), this endpoint already embeds the
   * rating summary and the review list, so one refetch refreshes both.
   */
  async function rateCourse(courseId: string, payload: { rating: number, comment: string }): Promise<boolean> {
    isRating.value = true
    try {
      const res = await http.post<{ meta?: { message?: string } }>(
        `${locale()}/student/courses/rate/${courseId}`,
        { type: 'user', id: 'null', payload: { rating: payload.rating, comment: payload.comment || null } }
      )
      const message = serverMessage(res)
      if (message) nuxtApp.$appToast.success(message)
      await fetchCourse(courseId)
      return true
    } catch {
      // The http client already surfaced the backend's message.
      return false
    } finally {
      isRating.value = false
    }
  }

  return {
    course,
    isLoading,
    isRating,
    sessionFiles,
    isLoadingFiles,
    fetchCourse,
    fetchSessionFiles,
    saveProgress,
    rateCourse
  }
})
