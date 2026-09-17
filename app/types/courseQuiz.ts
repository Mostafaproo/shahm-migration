export type QuizType = 'homework' | 'quiz,final_exam'

export interface CourseQuizAction {
  key: string
  label: string
  endpointUrl: string
}

export interface CourseQuiz {
  id: string
  title: string
  startAt: string
  endAt: string
  status: string
  actions: CourseQuizAction[]
}

interface RawAction {
  key?: string
  label?: string
  endpoint_url?: string
}

export interface RawCourseQuiz {
  id?: string | number
  title?: string
  start_at?: string
  end_at?: string
  status?: string
  actions?: { data?: RawAction[] }
}

export function toCourseQuiz(raw: RawCourseQuiz): CourseQuiz {
  return {
    id: String(raw.id ?? ''),
    title: raw.title ?? '',
    startAt: raw.start_at ?? '',
    endAt: raw.end_at ?? '',
    status: raw.status ?? '',
    actions: (raw.actions?.data ?? []).map(a => ({
      key: a.key ?? '',
      label: a.label ?? '',
      endpointUrl: a.endpoint_url ?? ''
    }))
  }
}

/** Legacy `getHomeworkAction` — the backend uses two keys for the same thing. */
export function startAction(quiz: CourseQuiz): CourseQuizAction | undefined {
  return quiz.actions.find(
    a => a.key === 'start_homework' || a.key === 'start_course_homework'
  )
}

// Legacy `onStartQuiz` decides "continue" vs "retry" from the status AND the
// action label, because neither alone is reliable across locales. Kept as-is:
// a wrong guess only affects whether local draft answers are cleared.
const CONTINUE_STATUSES = ['started', 'in-progress']
const CONTINUE_LABELS = ['استكمال', 'استمرار', 'continue', 'resume']

const FINISHED_STATUSES = ['finished', 'completed', 'success', 'انتهي', 'انتهى']
const RETRY_LABELS = ['إعادة', 'اعادة', 'retry', 're-', 'حاول']

export function isContinueAttempt(quiz: CourseQuiz, label: string): boolean {
  const status = quiz.status.toLowerCase()
  const text = label.toLowerCase()
  return CONTINUE_STATUSES.includes(status) || CONTINUE_LABELS.some(l => text.includes(l))
}

export function isRetryAttempt(quiz: CourseQuiz, label: string): boolean {
  if (isContinueAttempt(quiz, label)) return false
  const status = quiz.status.toLowerCase()
  const text = label.toLowerCase()
  return FINISHED_STATUSES.includes(status) || RETRY_LABELS.some(l => text.includes(l))
}
