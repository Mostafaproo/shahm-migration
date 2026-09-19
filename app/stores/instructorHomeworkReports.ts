import { defineStore } from 'pinia'
import { toReportQuestionLink } from '~/types/homeworkReport'
import type { RawReportQuestionLink, ReportQuestionLink } from '~/types/homeworkReport'
import {
  toExamStudentScore,
  toInstructorExamReport
} from '~/types/instructorHomeworkReport'
import type {
  ExamStudentScore,
  InstructorExamReport,
  RawExamStudentScore,
  RawInstructorExamReport
} from '~/types/instructorHomeworkReport'
import type { HomeworkQuestion } from '~/types/homeworkQuestion'

const BASE = 'general-quizzes/course-homework/instructor'

const QUIZ_TYPES = 'quiz,final_exam'

export const useInstructorHomeworkReportsStore = defineStore('instructorHomeworkReports', () => {
  const http = useHttp()
  const nuxtApp = useNuxtApp()

  // --- Level 1: the exams
  const exams = ref<InstructorExamReport[]>([])
  const courseId = ref<string | null>(null)
  const page = ref(1)
  const perPage = ref(10)
  const total = ref(0)
  const totalPages = ref(1)
  const isLoading = ref(false)

  // --- Level 2: one exam's students
  const students = ref<ExamStudentScore[]>([])
  const studentsPage = ref(1)
  const studentsPerPage = ref(10)
  const studentsTotal = ref(0)
  const studentsTotalPages = ref(1)
  const isLoadingStudents = ref(false)
  const isExporting = ref(false)

  // --- Level 3: one student's answers
  const questionLinks = ref<ReportQuestionLink[]>([])
  const activeIndex = ref(0)
  const question = ref<HomeworkQuestion | null>(null)
  const isLoadingFeedback = ref(false)
  const isSavingGrade = ref(false)

  const totalQuestions = computed(() => questionLinks.value.length)

  function locale(): string {
    return (unref((nuxtApp.$i18n as { locale?: unknown } | undefined)?.locale) as string | undefined) ?? 'ar'
  }

  // ---------------------------------------------------------------- level 1

  async function fetchExams(targetPage = page.value) {
    isLoading.value = true
    try {
      const res = await http.get<{
        data?: RawInstructorExamReport[] | {
          data?: RawInstructorExamReport[]
          meta?: { pagination?: Record<string, number> }
        }
        meta?: { pagination?: Record<string, number> }
      }>(`${locale()}/${BASE}/list`, {
        query: {
          page: targetPage,
          per_page: perPage.value,
          quiz_type: QUIZ_TYPES,
          report: true,
          // Omitted entirely for "all courses" — the legacy has no explicit
          // all-courses value, clearing the picker just drops the param.
          ...(courseId.value ? { course_id: courseId.value } : {})
        }
      })

      const doc = res?.data
      const rows = Array.isArray(doc) ? doc : (doc?.data ?? [])
      exams.value = rows.map(toInstructorExamReport)

      const pagination = (Array.isArray(doc) ? undefined : doc?.meta?.pagination)
        ?? res?.meta?.pagination
      page.value = pagination?.current_page ?? targetPage
      totalPages.value = pagination?.total_pages ?? 1
      total.value = pagination?.total ?? exams.value.length
    } catch {
      // The http client already surfaced the error toast.
      exams.value = []
      total.value = 0
      totalPages.value = 1
    } finally {
      isLoading.value = false
    }
  }

  async function setCourse(next: string | null) {
    courseId.value = next
    await fetchExams(1)
  }

  async function setPerPage(next: number) {
    perPage.value = next
    await fetchExams(1)
  }

  const setPage = (next: number) => fetchExams(next)

  // ---------------------------------------------------------------- level 2

  async function fetchStudents(homeworkId: string, targetPage = studentsPage.value) {
    if (!homeworkId) return
    isLoadingStudents.value = true
    try {
      const res = await http.get<{
        data?: {
          hwStudents?: { data?: RawExamStudentScore[] }
          pagination?: Record<string, number>
        }
      }>(`${locale()}/${BASE}/${homeworkId}/list-students-scores`, {
        query: { page: targetPage, per_page: studentsPerPage.value }
      })

      const body = res?.data
      students.value = (body?.hwStudents?.data ?? []).map(toExamStudentScore)

      const pagination = body?.pagination
      studentsPage.value = pagination?.current_page ?? targetPage
      studentsTotalPages.value = pagination?.total_pages ?? 1
      studentsTotal.value = pagination?.total ?? students.value.length
    } catch {
      students.value = []
      studentsTotal.value = 0
      studentsTotalPages.value = 1
    } finally {
      isLoadingStudents.value = false
    }
  }

  async function setStudentsPerPage(homeworkId: string, next: number) {
    studentsPerPage.value = next
    await fetchStudents(homeworkId, 1)
  }

  async function exportScores(homeworkId: string, filename: string) {
    await runExport(
      `${locale()}/${BASE}/${homeworkId}/export-students-scores`,
      filename
    )
  }

  async function exportGrades(homeworkId: string, filename: string) {
    await runExport(
      `${locale()}/${BASE}/export/students-grades/${homeworkId}`,
      filename
    )
  }

  async function runExport(url: string, filename: string) {
    isExporting.value = true
    try {
      const blob = await http.download(url, {
        query: {
          page: studentsPage.value,
          per_page: studentsPerPage.value,
          report: true
        }
      })
      saveBlob(blob, filename)
    } catch {
      // The http client already surfaced the error toast.
    } finally {
      isExporting.value = false
    }
  }

  // ---------------------------------------------------------------- level 3

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

  async function fetchFeedback(homeworkId: string, studentId: string) {
    if (!homeworkId || !studentId) return
    isLoadingFeedback.value = true
    try {
      const res = await http.get<{
        data?: { questions_pagination?: { data?: RawReportQuestionLink[] } }
      }>(`${locale()}/${BASE}/${homeworkId}/feedback/${studentId}`)

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

  async function gradeEssay(
    homeworkId: string,
    answerId: string,
    score: number
  ): Promise<string | null> {
    isSavingGrade.value = true
    try {
      const res = await http.put(
        `${locale()}/${BASE}/${homeworkId}/review-essay/${answerId}`,
        { type: 'general_quiz_answers', id: answerId, payload: { score } }
      )
      // Reflect it immediately: the legacy left the strip and the score stale
      // until a full reload.
      await fetchQuestion(activeIndex.value)
      return serverMessage(res) ?? ''
    } catch {
      return null
    } finally {
      isSavingGrade.value = false
    }
  }

  function resetFeedback() {
    questionLinks.value = []
    question.value = null
    activeIndex.value = 0
  }

  function resetStudents() {
    students.value = []
    studentsPage.value = 1
    studentsTotal.value = 0
    studentsTotalPages.value = 1
  }

  return {
    exams,
    courseId,
    page,
    perPage,
    total,
    totalPages,
    isLoading,
    students,
    studentsPage,
    studentsPerPage,
    studentsTotal,
    studentsTotalPages,
    isLoadingStudents,
    isExporting,
    questionLinks,
    activeIndex,
    question,
    totalQuestions,
    isLoadingFeedback,
    isSavingGrade,
    fetchExams,
    setCourse,
    setPerPage,
    setPage,
    fetchStudents,
    setStudentsPerPage,
    exportScores,
    exportGrades,
    fetchFeedback,
    fetchQuestion,
    gradeEssay,
    resetFeedback,
    resetStudents
  }
})
