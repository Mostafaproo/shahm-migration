export const EXAM_TYPES = ['quantitative', 'verbal', 'quantitative_and_verbal'] as const
export type ExamType = typeof EXAM_TYPES[number]

export interface ExamOption {
  id: number
  text: string
  isCorrect: boolean
}

export interface ExamQuestion {
  /** The attempt-scoped row id. */
  id: string
  questionId: number
  title: string
  instruction: string
  description: string
  section: 'quantitative' | 'verbal'
  options: ExamOption[]
  isMarked: boolean
  isAnswered: boolean
  selectedOptionId: number | null
  isCorrect: boolean
  correctAnswerDescription: string
}

interface RawExamQuestion {
  id?: string | number
  computerized_question_id?: number | string
  computerized_question_title?: string
  computerized_question_instruction?: string
  computerized_question_description?: string
  is_draft?: boolean
  is_answered?: boolean
  // Review rows (from `exam-details.answers`) carry these three extra fields.
  option_id?: string | number
  is_correct?: boolean
  correct_answer_description?: string
  computerized_question_type?: string
  computerized_question_option?: {
    data?: { id?: string | number, description?: string, is_correct?: boolean }[]
  }
}

export interface RawStartExamResponse {
  id?: string | number
  quantitative_questions?: { data?: RawExamQuestion[] }
  verbal_questions?: { data?: RawExamQuestion[] }
}

function toQuestion(raw: RawExamQuestion, section: ExamQuestion['section']): ExamQuestion {
  return {
    id: String(raw.id ?? ''),
    questionId: Number(raw.computerized_question_id ?? 0),
    title: raw.computerized_question_title ?? '',
    instruction: raw.computerized_question_instruction ?? '',
    description: raw.computerized_question_description ?? '',
    section,
    options: (raw.computerized_question_option?.data ?? []).map(opt => ({
      id: Number(opt.id ?? 0),
      text: opt.description ?? '',
      isCorrect: Boolean(opt.is_correct)
    })),
    isMarked: Boolean(raw.is_draft),
    isAnswered: Boolean(raw.is_answered),
    selectedOptionId: raw.option_id != null ? Number(raw.option_id) : null,
    isCorrect: Boolean(raw.is_correct),
    correctAnswerDescription: raw.correct_answer_description ?? ''
  }
}

export function toReviewQuestions(raw: {
  type?: string
  answers?: { data?: RawExamQuestion[] }
}): ExamQuestion[] {
  return (raw.answers?.data ?? []).map(answer =>
    toQuestion(answer, answer.computerized_question_type === 'verbal' ? 'verbal' : 'quantitative')
  )
}

export function toExamQuestions(raw: RawStartExamResponse): ExamQuestion[] {
  return [
    ...(raw.quantitative_questions?.data ?? []).map(q => toQuestion(q, 'quantitative')),
    ...(raw.verbal_questions?.data ?? []).map(q => toQuestion(q, 'verbal'))
  ]
}

// --- Settings

export interface ExamSettings {
  /** Minutes allowed; the runner's countdown starts from this. */
  durationMinutes: number | null
  instructions: string
  questionMapInstruction: string
  // Legacy disables the "start a new exam" button unless ALL THREE are true.
  isFeatureAvailable: boolean
  canEnterExam: boolean
  isSubscribed: boolean
  /** Only selects which of the two empty-state messages the list shows. */
  isPublic: boolean
}

export interface RawExamSettings {
  time?: number | string
  duration?: number | string
  instruction?: string
  instructions?: string
  question_map_instruction?: string
  is_feature_available?: boolean
  can_enter_exam?: boolean
  is_subscribed?: boolean
  is_public?: boolean
}

export function toExamSettings(raw: RawExamSettings): ExamSettings {
  const minutes = raw.time ?? raw.duration
  const parsed = minutes != null ? Number(minutes) : null
  return {
    durationMinutes: parsed != null && Number.isFinite(parsed) && parsed > 0 ? parsed : null,
    instructions: raw.instruction ?? raw.instructions ?? '',
    questionMapInstruction: raw.question_map_instruction ?? '',
    isFeatureAvailable: Boolean(raw.is_feature_available),
    canEnterExam: Boolean(raw.can_enter_exam),
    isSubscribed: Boolean(raw.is_subscribed),
    isPublic: Boolean(raw.is_public)
  }
}

export function canStartExam(settings: ExamSettings | null): boolean {
  return Boolean(
    settings
    && settings.isFeatureAvailable
    && settings.canEnterExam
    && settings.isSubscribed
  )
}

// --- Past attempts list

export interface ExamListRow {
  id: string
  date: string
  verbalScore: number
  quantitativeScore: number
  overallScore: number
  /** Minutes, already rounded — the API sends seconds. */
  timeSpentMinutes: string
}

export interface RawExamListRow {
  id?: string | number
  date?: string
  verbal_score?: string | number
  quantitative_score?: string | number
  overall_score?: string | number
  time_spent?: string | number
}

/** Legacy `convertSecondsToMinutes` — rounded, and 0 stays "0" not "NaN". */
export function secondsToMinutes(seconds: string | number | undefined): string {
  const value = Number(seconds ?? 0)
  if (!value || Number.isNaN(value)) return '0'
  return String(Math.round(value / 60))
}

export function toExamListRow(raw: RawExamListRow): ExamListRow {
  return {
    id: String(raw.id ?? ''),
    date: raw.date ?? '',
    verbalScore: Number(raw.verbal_score ?? 0) || 0,
    quantitativeScore: Number(raw.quantitative_score ?? 0) || 0,
    overallScore: Number(raw.overall_score ?? 0) || 0,
    timeSpentMinutes: secondsToMinutes(raw.time_spent)
  }
}

// --- Result

export interface SectionBreakdown {
  correct: number
  wrong: number
  marked: number
  total: number
}

export interface ExamResult {
  id: string
  /** `quantitative` | `verbal` | `quantitative_and_verbal`. */
  type: string
  createdAt: string
  /** Header badge, rendered by the legacy as `total_count-degree`. */
  totalCount: number
  degree: number
  /** Header badge; the raw `time` field, formatted mm:ss. */
  time: string
  verbalScore: number
  quantitativeScore: number
  verbalDegree: number
  quantitativeDegree: number
  verbalQuestionCount: number
  quantitativeQuestionCount: number
  correct: number
  wrong: number
  marked: number
  quantitative: SectionBreakdown
  verbal: SectionBreakdown
}

interface RawResultAnswer {
  computerized_question_type?: string
  is_correct?: boolean
  is_answered?: boolean
  is_draft?: boolean
}

export interface RawExamResult {
  id?: string | number
  type?: string
  created_at?: string
  degree?: string | number
  time?: string | number
  verbal_score?: string | number
  quantitative_score?: string | number
  verbal_degree?: string | number
  quantitative_degree?: string | number
  verbal_question_count?: string | number
  quantitative_question_count?: string | number
  total_count?: number
  is_correct_count?: number
  wrong_count?: number
  is_draft_count?: number
  answers?: { data?: RawResultAnswer[] }
}

/** Legacy `formatTime` on the header badge — seconds rendered as mm:ss. */
export function formatSeconds(value: string | number | undefined): string {
  const total = Number(value ?? 0)
  if (!total || Number.isNaN(total)) return '00:00'
  const minutes = Math.floor(total / 60)
  const seconds = Math.floor(total % 60)
  return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`
}

/** Legacy tallies each section client-side from the answers list. */
function breakdown(answers: RawResultAnswer[], section: string): SectionBreakdown {
  const rows = answers.filter(a => a.computerized_question_type === section)
  return {
    correct: rows.filter(a => a.is_correct).length,
    wrong: rows.filter(a => !a.is_correct && a.is_answered).length,
    marked: rows.filter(a => a.is_draft).length,
    total: rows.length
  }
}

export function toExamResult(raw: RawExamResult): ExamResult {
  const answers = raw.answers?.data ?? []
  return {
    id: String(raw.id ?? ''),
    type: raw.type ?? '',
    createdAt: raw.created_at ?? '',
    totalCount: Number(raw.total_count ?? answers.length) || 0,
    degree: Number(raw.degree ?? 0) || 0,
    time: formatSeconds(raw.time),
    verbalScore: Number(raw.verbal_score ?? 0) || 0,
    quantitativeScore: Number(raw.quantitative_score ?? 0) || 0,
    verbalDegree: Number(raw.verbal_degree ?? 0) || 0,
    quantitativeDegree: Number(raw.quantitative_degree ?? 0) || 0,
    verbalQuestionCount: Number(raw.verbal_question_count ?? 0) || 0,
    quantitativeQuestionCount: Number(raw.quantitative_question_count ?? 0) || 0,
    correct: raw.is_correct_count ?? 0,
    wrong: raw.wrong_count ?? 0,
    marked: raw.is_draft_count ?? 0,
    quantitative: breakdown(answers, 'quantitative'),
    verbal: breakdown(answers, 'verbal')
  }
}

export function examTypeKey(type: string): string {
  return `computerized.types.${type}`
}
