// --- Level 1: one exam in the instructor's report list

export interface AssessmentExamReport {
  id: string
  title: string
  publishedAt: string
  startAt: string
  endAt: string
  /** Class average, as the backend computes it. */
  average: string
  /** Total grade the exam is out of. */
  mark: string
}

export interface RawAssessmentExamReport {
  id?: string | number
  title?: string
  published_at?: string
  start_at?: string
  end_at?: string
  avg?: string | number
  mark?: string | number
}

function text(value: unknown): string {
  return value == null || value === '' ? '' : String(value)
}

export function toAssessmentExamReport(raw: RawAssessmentExamReport): AssessmentExamReport {
  return {
    id: String(raw.id ?? ''),
    title: raw.title ?? '',
    publishedAt: text(raw.published_at),
    startAt: text(raw.start_at),
    endAt: text(raw.end_at),
    average: text(raw.avg),
    mark: text(raw.mark)
  }
}

// --- Level 2: one student's line on an exam

export interface ExamStudentScore {
  id: string
  name: string
  score: string
  attended: boolean
}

export interface RawExamStudentScore {
  id?: string | number
  name?: string
  score?: string | number
  is_attend?: boolean
}

export function toExamStudentScore(raw: RawExamStudentScore): ExamStudentScore {
  return {
    id: String(raw.id ?? ''),
    name: raw.name ?? '',
    score: text(raw.score),
    attended: Boolean(raw.is_attend)
  }
}
