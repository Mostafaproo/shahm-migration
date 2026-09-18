import { defineStore } from 'pinia'
import {
  toDiscussionStudent,
  toInstructorCourse,
  toInstructorSession
} from '~/types/instructorCourse'
import type {
  DiscussionStudent,
  InstructorCourse,
  InstructorSession,
  RawDiscussionStudent,
  RawInstructorCourse,
  RawInstructorSession
} from '~/types/instructorCourse'

export const useInstructorCoursesStore = defineStore('instructorCourses', () => {
  const http = useHttp()
  const nuxtApp = useNuxtApp()

  const courses = ref<InstructorCourse[]>([])
  const coursesPage = ref(1)
  const coursesTotalPages = ref(1)
  const isLoadingCourses = ref(false)

  const sessions = ref<InstructorSession[]>([])
  const sessionsPage = ref(1)
  const sessionsTotalPages = ref(1)
  const isLoadingSessions = ref(false)

  const students = ref<DiscussionStudent[]>([])
  /** The course the roster was loaded for, so a toggle can refresh its room. */
  const studentsCourseId = ref('')
  const isLoadingStudents = ref(false)
  const togglingStudentId = ref<string | null>(null)

  const hasMoreCourses = computed(() => coursesPage.value < coursesTotalPages.value)

  function locale(): string {
    return (unref((nuxtApp.$i18n as { locale?: unknown } | undefined)?.locale) as string | undefined) ?? 'ar'
  }

  async function loadCourses(page: number): Promise<InstructorCourse[]> {
    const res = await http.get<{
      data?: RawInstructorCourse[] | { data?: RawInstructorCourse[] }
      meta?: { pagination?: { current_page?: number, total_pages?: number } }
    }>(`${locale()}/instructor/courses`, { query: { page } })

    const doc = res?.data
    const rows = Array.isArray(doc) ? doc : (doc?.data ?? [])

    const pagination = res?.meta?.pagination
    coursesPage.value = pagination?.current_page ?? page
    coursesTotalPages.value = pagination?.total_pages ?? 1

    return rows.map(toInstructorCourse)
  }

  async function fetchCourses() {
    isLoadingCourses.value = true
    try {
      courses.value = await loadCourses(1)
    } catch {
      // The http client already surfaced the error toast.
      courses.value = []
    } finally {
      isLoadingCourses.value = false
    }
  }

  /** Legacy pages the course list with infinite scroll; this appends the same way. */
  async function loadMoreCourses() {
    if (!hasMoreCourses.value || isLoadingCourses.value) return
    isLoadingCourses.value = true
    try {
      courses.value = [...courses.value, ...(await loadCourses(coursesPage.value + 1))]
    } catch {
      coursesTotalPages.value = coursesPage.value
    } finally {
      isLoadingCourses.value = false
    }
  }

  async function fetchSessions(courseId: string, page = 1) {
    if (!courseId) {
      sessions.value = []
      return
    }
    isLoadingSessions.value = true
    try {
      const res = await http.get<{
        data?: RawInstructorSession[] | { data?: RawInstructorSession[] }
        meta?: { pagination?: { current_page?: number, total_pages?: number } }
      }>(`${locale()}/instructor/course-sessions/${courseId}`, { query: { page } })

      const doc = res?.data
      const rows = Array.isArray(doc) ? doc : (doc?.data ?? [])
      const mapped = rows.map(toInstructorSession)
      sessions.value = page === 1 ? mapped : [...sessions.value, ...mapped]

      const pagination = res?.meta?.pagination
      sessionsPage.value = pagination?.current_page ?? page
      sessionsTotalPages.value = pagination?.total_pages ?? 1
    } catch {
      if (page === 1) sessions.value = []
      sessionsTotalPages.value = sessionsPage.value
    } finally {
      isLoadingSessions.value = false
    }
  }

  async function fetchStudents(courseId: string) {
    if (!courseId) return
    studentsCourseId.value = courseId
    isLoadingStudents.value = true
    try {
      const res = await http.get<{
        data?: RawDiscussionStudent[] | { data?: RawDiscussionStudent[] }
      }>(`${locale()}/discussions/instructor/${courseId}/students/list`)

      const doc = res?.data
      const rows = Array.isArray(doc) ? doc : (doc?.data ?? [])
      students.value = rows.map(toDiscussionStudent)
    } catch {
      students.value = []
    } finally {
      isLoadingStudents.value = false
    }
  }


  async function toggleStudent(student: DiscussionStudent): Promise<void> {
    if (!student.toggleUrl) return
    togglingStudentId.value = student.id
    const next = !student.isActive
    student.isActive = next
    try {
      await http.get(student.toggleUrl)
      const room = useCourseDiscussionsStore()
      if (room.discussions.length) await room.fetchList(studentsCourseId.value)
    } catch {
      student.isActive = !next
    } finally {
      togglingStudentId.value = null
    }
  }

  function reset() {
    sessions.value = []
    sessionsPage.value = 1
    sessionsTotalPages.value = 1
    students.value = []
    studentsCourseId.value = ''
  }

  return {
    courses,
    coursesPage,
    coursesTotalPages,
    isLoadingCourses,
    hasMoreCourses,
    sessions,
    sessionsPage,
    sessionsTotalPages,
    isLoadingSessions,
    students,
    studentsCourseId,
    isLoadingStudents,
    togglingStudentId,
    fetchCourses,
    loadMoreCourses,
    fetchSessions,
    fetchStudents,
    toggleStudent,
    reset
  }
})
