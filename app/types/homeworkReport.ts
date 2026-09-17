export interface HomeworkReport {
  id: string
  title: string
  assessmentType: string
  startAt: string
  endAt: string
  score: string
  hasAnswers: boolean
}

export interface RawHomeworkReport {
  id?: string | number
  title?: string
  quiz_type?: string
  type?: string
  start_at?: string
  end_at?: string
  score?: string | number
  actions?: { data?: unknown[] } | unknown[]
}

/** The course dropdown above the table, supplied by the list response's meta. */
export interface ReportCourseOption {
  id: string
  title: string
}

export interface RawReportCourseOption {
  id?: string | number
  title?: string
  name?: string
}

/** Legacy `getAssessmentTypeLabel` — falls back to the raw value when unknown. */
const TYPE_KEYS: Record<string, string> = {
  homework: 'reports.types.homework',
  quiz: 'reports.types.quiz',
  final_exam: 'reports.types.final_exam'
}

export function assessmentTypeKey(type: string): string | null {
  return TYPE_KEYS[type] ?? null
}

export function toHomeworkReport(raw: RawHomeworkReport): HomeworkReport {
  const actions = Array.isArray(raw.actions) ? raw.actions : raw.actions?.data
  return {
    id: String(raw.id ?? ''),
    title: raw.title ?? '',
    assessmentType: raw.quiz_type || raw.type || '',
    startAt: raw.start_at ?? '',
    endAt: raw.end_at ?? '',
    score: raw.score != null ? String(raw.score) : '',
    hasAnswers: Boolean(actions && (actions as unknown[]).length)
  }
}

export function toReportCourseOption(raw: RawReportCourseOption): ReportCourseOption {
  return {
    id: String(raw.id ?? ''),
    title: raw.title || raw.name || ''
  }
}

// --- Feedback view

export interface ReportQuestionLink {
  id: string
  endpointUrl: string
  isCorrect: boolean | null
}

export interface RawReportQuestionLink {
  id?: string | number
  is_correct_answer?: boolean | null
  actions?: { data?: { endpoint_url?: string }[] }
}

export function toReportQuestionLink(raw: RawReportQuestionLink): ReportQuestionLink {
  return {
    id: String(raw.id ?? ''),
    endpointUrl: raw.actions?.data?.[0]?.endpoint_url ?? '',
    isCorrect: raw.is_correct_answer ?? null
  }
}
