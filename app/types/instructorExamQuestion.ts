export const EXAM_QUESTION_TYPES = ['verbal', 'quantitative'] as const
export type ExamQuestionType = typeof EXAM_QUESTION_TYPES[number]

export interface ExamQuestionOption {
  id: string | null
  option: string
  isCorrect: boolean
}

export interface RawExamQuestionOption {
  id?: string | number
  description?: string
  is_correct?: boolean
}

export function toExamQuestionOption(raw: RawExamQuestionOption): ExamQuestionOption {
  return {
    id: raw.id != null ? String(raw.id) : null,
    option: raw.description ?? '',
    isCorrect: Boolean(raw.is_correct)
  }
}

export interface ExamQuestion {
  id: string
  title: string
  questionType: string
  /** All four of these are HTML. */
  description: string
  correctAnswerDescription: string
  instruction: string
  isActive: boolean
  createdAt: string
  updatedAt: string
  options: ExamQuestionOption[]
  optionsCount: number
}

export interface RawExamQuestion {
  id?: string | number
  question_title?: string
  question_type?: string
  question_description?: string
  correct_answer_description?: string
  question_instruction?: string
  is_active?: boolean
  created_at?: string
  updated_at?: string
  options?: { data?: RawExamQuestionOption[] } | RawExamQuestionOption[]
}

export function toExamQuestion(raw: RawExamQuestion): ExamQuestion {
  const rows = Array.isArray(raw.options) ? raw.options : (raw.options?.data ?? [])
  const options = rows.map(toExamQuestionOption)
  return {
    id: String(raw.id ?? ''),
    title: raw.question_title ?? '',
    questionType: raw.question_type ?? '',
    description: raw.question_description ?? '',
    correctAnswerDescription: raw.correct_answer_description ?? '',
    instruction: raw.question_instruction ?? '',
    isActive: Boolean(raw.is_active),
    createdAt: raw.created_at ?? '',
    updatedAt: raw.updated_at ?? '',
    options,
    optionsCount: options.length
  }
}

/** Legacy maps only these two and shows anything else verbatim. */
const TYPE_KEYS: Record<string, string> = {
  verbal: 'instructorExamQuestions.types.verbal',
  quantitative: 'instructorExamQuestions.types.quantitative'
}

export function questionTypeKey(type: string): string | null {
  return TYPE_KEYS[type] ?? null
}
