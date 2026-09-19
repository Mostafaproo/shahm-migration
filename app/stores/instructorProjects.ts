import { defineStore } from 'pinia'
import {
  hasProject,
  toFinalProject,
  toProjectPath,
  submissionAction,
  toProjectStudent,
  toStudentSubmission
} from '~/types/instructorProject'
import type {
  FinalProject,
  ProjectPath,
  ProjectStudent,
  RawFinalProject,
  RawProjectPath,
  RawProjectStudent,
  RawStudentSubmission,
  StudentSubmission
} from '~/types/instructorProject'

const BASE = 'instructor/learning-paths'

export interface FinalProjectPayload {
  finalGrade: string
  watchPdf: boolean
  watchVideos: boolean
  /** Uploaded inline with the form, not through the media endpoint. */
  requirementsFile: File | null
  /** Ids from the shared media uploader, attached as relationships. */
  mediaIds: { id: string, type: string, fileType: string }[]
}

export const useInstructorProjectsStore = defineStore('instructorProjects', () => {
  const http = useHttp()
  const nuxtApp = useNuxtApp()

  // --- The path list
  const paths = ref<ProjectPath[]>([])
  const search = ref('')
  const page = ref(1)
  const perPage = ref(10)
  const total = ref(0)
  const totalPages = ref(1)
  const isLoading = ref(false)

  // --- One path's project
  const project = ref<FinalProject | null>(null)
  /** Whether the path already has one — drives add-vs-edit wording. */
  const projectExists = ref(false)
  const isLoadingProject = ref(false)
  const isSubmitting = ref(false)

  // --- One path's students
  const students = ref<ProjectStudent[]>([])
  const studentsPage = ref(1)
  const studentsPerPage = ref(10)
  const studentsTotal = ref(0)
  const studentsTotalPages = ref(1)
  const isLoadingStudents = ref(false)

  // --- One student's submission
  const submission = ref<StudentSubmission | null>(null)
  const isLoadingSubmission = ref(false)
  const isSavingGrade = ref(false)

  function locale(): string {
    return (unref((nuxtApp.$i18n as { locale?: unknown } | undefined)?.locale) as string | undefined) ?? 'ar'
  }

 
  function readPagination(res: unknown): Record<string, number> | undefined {
    const r = res as {
      data?: { meta?: { pagination?: Record<string, number> } }
      meta?: { pagination?: Record<string, number> }
    } | undefined
    return r?.data?.meta?.pagination ?? r?.meta?.pagination
  }

  async function fetchPaths(targetPage = page.value) {
    isLoading.value = true
    try {
      const res = await http.get<{
        data?: RawProjectPath[] | { data?: RawProjectPath[] }
      }>(`${locale()}/${BASE}`, {
        query: {
          page: targetPage,
          per_page: perPage.value,
          // Only sent when there is something to search for, as in the legacy.
          ...(search.value.trim() ? { learning_path_name: search.value.trim() } : {})
        }
      })

      const doc = res?.data
      const rows = Array.isArray(doc) ? doc : (doc?.data ?? [])
      paths.value = rows.map(toProjectPath)

      const pagination = readPagination(res)
      page.value = pagination?.current_page ?? targetPage
      totalPages.value = pagination?.total_pages ?? 1
      total.value = pagination?.total ?? paths.value.length
    } catch {
      // The http client already surfaced the error toast.
      paths.value = []
      total.value = 0
      totalPages.value = 1
    } finally {
      isLoading.value = false
    }
  }

  async function setSearch(next: string) {
    search.value = next
    await fetchPaths(1)
  }

  async function setPerPage(next: number) {
    perPage.value = next
    await fetchPaths(1)
  }

  const setPage = (next: number) => fetchPaths(next)

  async function fetchProject(pathId: string) {
    if (!pathId) return
    isLoadingProject.value = true
    try {
      const res = await http.get<{ data?: RawFinalProject }>(
        `${locale()}/${BASE}/${pathId}/final-project`
      )
      // Trust the response, not the caller's ?isEdit= query, which goes
      // stale if the project was removed elsewhere.
      projectExists.value = hasProject(res?.data)
      project.value = projectExists.value && res?.data ? toFinalProject(res.data) : null
    } catch {
      project.value = null
      projectExists.value = false
    } finally {
      isLoadingProject.value = false
    }
  }


  async function saveProject(pathId: string, payload: FinalProjectPayload): Promise<boolean> {
    isSubmitting.value = true
    try {
      const form = new FormData()
      form.append('type', 'final_project')
      form.append('id', 'null')
      form.append('attributes[final_grade]', payload.finalGrade)
      form.append('attributes[watch_pdf]', payload.watchPdf ? '1' : '0')
      form.append('attributes[watch_videos]', payload.watchVideos ? '1' : '0')
      if (payload.requirementsFile) {
        form.append('attributes[requirements_file]', payload.requirementsFile)
      }
      payload.mediaIds.forEach((media, i) => {
        form.append(`relationships[medias][data][${i}][type]`, media.type)
        form.append(`relationships[medias][data][${i}][file_type]`, media.fileType)
        form.append(`relationships[medias][data][${i}][id]`, media.id)
      })

      const res = await http.post(
        `${locale()}/${BASE}/${pathId}/final-project`,
        form,
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

  /** The video half of the form: a Google Drive URL rather than an upload. */
  async function attachLink(pathId: string, link: string): Promise<boolean> {
    try {
      const res = await http.post(
        `${locale()}/${BASE}/${pathId}/attach-link`,
        { type: 'final_project', id: 'null', payload: { videos: link } }
      )
      const message = serverMessage(res)
      if (message) nuxtApp.$appToast.success(message)
      return true
    } catch {
      return false
    }
  }

  async function fetchStudents(pathId: string, targetPage = studentsPage.value) {
    if (!pathId) return
    isLoadingStudents.value = true
    try {
      const res = await http.get<{
        data?: RawProjectStudent[] | { data?: RawProjectStudent[] }
      }>(`${locale()}/${BASE}/${pathId}/student-final-projects`, {
        query: { page: targetPage, per_page: studentsPerPage.value }
      })

      const doc = res?.data
      const rows = Array.isArray(doc) ? doc : (doc?.data ?? [])
      students.value = rows.map(toProjectStudent)

      const pagination = readPagination(res)
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

  async function setStudentsPerPage(pathId: string, next: number) {
    studentsPerPage.value = next
    await fetchStudents(pathId, 1)
  }


  async function fetchSubmission(url: string, method: string) {
    if (!url) return
    isLoadingSubmission.value = true
    try {
      const res = await http.request<RawStudentSubmission>(url, { method: (method || 'GET') as 'GET' })
      submission.value = res ? toStudentSubmission(res) : null
    } catch {
      submission.value = null
    } finally {
      isLoadingSubmission.value = false
    }
  }


  async function saveGrade(grade: string): Promise<boolean> {
    const action = submissionAction(submission.value, 'submit_final_project')
    if (!action) return false
    isSavingGrade.value = true
    try {
      const res = await http.request(action.endpointUrl, {
        method: action.method as 'POST',
        serialize: false,
        body: {
          data: {
            type: 'student_final_project',
            id: 'null',
            attributes: { grade }
          }
        }
      })
      const message = serverMessage(res)
      if (message) nuxtApp.$appToast.success(message)
      if (submission.value) submission.value.grade = grade
      return true
    } catch {
      return false
    } finally {
      isSavingGrade.value = false
    }
  }


  async function reviewAndOpen(studentId: string): Promise<string> {
    const action = submissionAction(submission.value, 'review_final_project')
    const url = submission.value?.solvedFileUrl ?? ''
    if (action) {
      try {
        await http.request(action.endpointUrl, {
          method: action.method as 'POST',
          serialize: false,
          body: {
            data: {
              type: 'final_project_media',
              id: 'null',
              attributes: { student_id: Number(studentId) }
            }
          }
        })
      } catch {
        // Swallowed on purpose — see above.
      }
    }
    return url
  }

  function resetSubmission() {
    submission.value = null
  }

  function resetProject() {
    project.value = null
    projectExists.value = false
  }

  function resetStudents() {
    students.value = []
    studentsPage.value = 1
    studentsTotal.value = 0
    studentsTotalPages.value = 1
  }

  return {
    paths,
    search,
    page,
    perPage,
    total,
    totalPages,
    isLoading,
    project,
    projectExists,
    isLoadingProject,
    isSubmitting,
    students,
    studentsPage,
    studentsPerPage,
    studentsTotal,
    studentsTotalPages,
    isLoadingStudents,
    fetchPaths,
    setSearch,
    setPerPage,
    setPage,
    fetchProject,
    saveProject,
    attachLink,
    fetchStudents,
    setStudentsPerPage,
    submission,
    isLoadingSubmission,
    isSavingGrade,
    fetchSubmission,
    saveGrade,
    reviewAndOpen,
    resetSubmission,
    resetProject,
    resetStudents
  }
})
