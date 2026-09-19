export interface AssessmentAction {
  key: string
  label: string
  endpointUrl: string
}

export interface InstructorAssessment {
  id: string
  title: string
  publishedAt: string
  startAt: string
  endAt: string
  isPublished: boolean
  randomQuestion: boolean
  /** `quiz` or `final_exam` on this screen; `homework` lives in assignments. */
  quizType: string
  courseId: string
  courseName: string
  /** Drives every row button — the backend decides what this user may do. */
  actions: AssessmentAction[]
}

export interface RawAssessmentAction {
  key?: string
  label?: string
  endpoint_url?: string
}

export interface RawInstructorAssessment {
  id?: string | number
  title?: string
  published_at?: string
  start_at?: string
  end_at?: string
  is_published?: boolean
  random_question?: boolean
  quiz_type?: string
  course?: { data?: { id?: string | number, name?: string } }
  actions?: { data?: RawAssessmentAction[] }
}

export function toInstructorAssessment(raw: RawInstructorAssessment): InstructorAssessment {
  const course = raw.course?.data
  return {
    id: String(raw.id ?? ''),
    title: raw.title ?? '',
    publishedAt: raw.published_at ?? '',
    startAt: raw.start_at ?? '',
    endAt: raw.end_at ?? '',
    isPublished: Boolean(raw.is_published),
    randomQuestion: Boolean(raw.random_question),
    quizType: raw.quiz_type ?? '',
    courseId: course?.id != null ? String(course.id) : '',
    courseName: course?.name ?? '',
    actions: (raw.actions?.data ?? []).map(a => ({
      key: a.key ?? '',
      label: a.label ?? '',
      endpointUrl: a.endpoint_url ?? ''
    }))
  }
}

export function hasAction(homework: InstructorAssessment | null, key: string): boolean {
  return Boolean(homework?.actions.some(a => a.key === key))
}

// --- The question list on the builder page

export interface AssessmentQuestionRow {
  id: string
  description: string
}

export interface RawAssessmentQuestionRow {
  id?: string | number
  questionData?: { data?: { description?: string, question?: string } }
}

export function toAssessmentQuestionRow(raw: RawAssessmentQuestionRow): AssessmentQuestionRow {
  const q = raw.questionData?.data
  return {
    id: String(raw.id ?? ''),
    description: q?.description || q?.question || ''
  }
}


export const BUILDER_QUESTION_TYPES = [
  'true_false',
  'true_false_with_correct',
  'complete',
  'single_choice',
  'multiple_choice',
  'essay',
  'drag_drop_text',
  'drag_drop_image'
] as const

export type BuilderQuestionType = typeof BUILDER_QUESTION_TYPES[number]
