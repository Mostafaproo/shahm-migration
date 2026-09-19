export interface ProjectPath {
  id: string
  name: string
  pathType: string
  hasFinalProject: boolean
}

export interface RawProjectPath {
  id?: string | number
  name?: string
  path_type?: string
  has_final_project?: boolean
}

export function toProjectPath(raw: RawProjectPath): ProjectPath {
  return {
    id: String(raw.id ?? ''),
    name: raw.name ?? '',
    pathType: raw.path_type ?? '',
    hasFinalProject: Boolean(raw.has_final_project)
  }
}

/** The legacy maps only these two and falls through to the raw value. */
const PATH_TYPE_KEYS: Record<string, string> = {
  fixed: 'instructorProjects.path_types.fixed',
  flexible: 'instructorProjects.path_types.flexible'
}

export function pathTypeKey(pathType: string): string | null {
  return PATH_TYPE_KEYS[pathType] ?? null
}

// --- One path's final project

export interface ProjectMedia {
  id: string
  fileName: string
  url: string
  /** `pdf` / `video` — what the file tables split on. */
  fileType: string
  createdAt: string
}

export interface RawProjectMedia {
  id?: string | number
  /** Some rows arrive still wrapped; sarala flattens most but not all. */
  attributes?: Omit<RawProjectMedia, 'attributes'>
  source_file_name?: string
  file_name?: string
  name?: string
  url?: string
  /** Occasionally the URL arrives under `file` instead. */
  file?: string
  created_at?: string
}

/** Last path segment, used when the row carries no name of its own. */
function basename(url: string): string {
  return url.split('/').pop() || url
}

export function toProjectMedia(raw: RawProjectMedia, fileType: string): ProjectMedia {
  const source = raw.attributes ?? raw
  const url = source.url || source.file || ''
  return {
    id: String(raw.id ?? source.id ?? url),
    fileName: source.source_file_name || source.file_name || source.name || basename(url),
    url,
    fileType,
    createdAt: source.created_at ?? ''
  }
}

/** A row with no URL is not openable, so the legacy drops it from the table. */
function mediaList(
  rel: { data?: RawProjectMedia[] } | RawProjectMedia[] | undefined,
  fileType: string
): ProjectMedia[] {
  const rows = Array.isArray(rel) ? rel : (rel?.data ?? [])
  return rows.map(row => toProjectMedia(row, fileType)).filter(m => m.url)
}

export interface FinalProject {
  id: string
  /** Total marks the project is out of. */
  finalGrade: string
  /** Students must open the reading files before submitting. */
  watchPdf: boolean
  watchVideos: boolean
  requirementsFileUrl: string
  readableFiles: ProjectMedia[]
  videoFiles: ProjectMedia[]
}

export interface RawFinalProject {
  id?: string | number
  final_project_grade?: string | number
  final_grade?: string | number
  watch_pdf_required?: boolean | number
  watch_pdf?: boolean | number
  watch_video_required?: boolean | number
  watch_videos?: boolean | number
  requirements_file?: string
  requirements_file_url?: string
  pdf_media?: { data?: RawProjectMedia[] } | RawProjectMedia[]
  video_media?: { data?: RawProjectMedia[] } | RawProjectMedia[]
}

export function toFinalProject(raw: RawFinalProject): FinalProject {
  const grade = raw.final_project_grade ?? raw.final_grade
  return {
    id: String(raw.id ?? ''),
    finalGrade: grade != null ? String(grade) : '',
    watchPdf: Boolean(raw.watch_pdf_required ?? raw.watch_pdf),
    watchVideos: Boolean(raw.watch_video_required ?? raw.watch_videos),
    requirementsFileUrl: raw.requirements_file_url || raw.requirements_file || '',
    readableFiles: mediaList(raw.pdf_media, 'pdf'),
    videoFiles: mediaList(raw.video_media, 'video')
  }
}

export function hasProject(raw: RawFinalProject | null | undefined): boolean {
  if (!raw || typeof raw !== 'object') return false
  return Object.keys(raw).length > 0
    && (raw.final_project_grade ?? raw.final_grade) != null
}

// --- A path's students and their submissions

export interface ProjectStudent {
  id: string
  name: string
  email: string
  mobile: string
  registeredAt: string
  submissionUrl: string
  submissionMethod: string
  hasSubmission: boolean
}

export interface RawProjectStudent {
  id?: string | number
  name?: string
  student_name?: string
  email?: string
  mobile?: string
  created_at?: string
  registration_date?: string
  actions?: { data?: { key?: string, method?: string, endpoint_url?: string }[] }
}

export function toProjectStudent(raw: RawProjectStudent): ProjectStudent {
  const view = (raw.actions?.data ?? []).find(a => a.key === 'view_student_final_project')
  return {
    id: String(raw.id ?? ''),
    name: raw.student_name || raw.name || '',
    email: raw.email ?? '',
    mobile: raw.mobile ?? '',
    registeredAt: raw.registration_date || raw.created_at || '',
    submissionUrl: view?.endpoint_url ?? '',
    submissionMethod: (view?.method || 'GET').toUpperCase(),
    hasSubmission: Boolean(view?.endpoint_url)
  }
}

// --- One student's submission

export interface StudentSubmission {
  grade: string
  /** Out of what — also the ceiling on the grade input. */
  finalGrade: string
  watchedAllPdfs: boolean
  watchedAllVideos: boolean
  solvedFileUrl: string
  canUpdateGrade: boolean
  actions: { key: string, method: string, endpointUrl: string }[]
}

export interface RawStudentSubmission {
  grade?: string | number
  final_grade?: string | number
  isWatchedAllPdfs?: boolean
  isWatchedAllvideos?: boolean
  solved_file?: string
  can_update_grade?: boolean
  actions?: { data?: { key?: string, method?: string, endpoint_url?: string }[] }
}

export function toStudentSubmission(raw: RawStudentSubmission): StudentSubmission {
  return {
    grade: raw.grade != null ? String(raw.grade) : '',
    finalGrade: raw.final_grade != null ? String(raw.final_grade) : '',
    watchedAllPdfs: Boolean(raw.isWatchedAllPdfs),
    watchedAllVideos: Boolean(raw.isWatchedAllvideos),
    solvedFileUrl: raw.solved_file ?? '',
    canUpdateGrade: Boolean(raw.can_update_grade),
    actions: (raw.actions?.data ?? []).map(a => ({
      key: a.key ?? '',
      method: (a.method || 'POST').toUpperCase(),
      endpointUrl: a.endpoint_url ?? ''
    }))
  }
}

export function submissionAction(submission: StudentSubmission | null, key: string) {
  return submission?.actions.find(a => a.key === key)
}
