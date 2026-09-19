// app/types/homeworkQuestion.ts
//
// One question of a homework attempt, plus the per-type answer payload builder.
//
// The legacy kept this as TWELVE near-identical Vuex modules under
// `store/questions/<type>/` — each with its own state/mutations/getters whose
// only real difference was the `answerObject` shape and how `answer` is seeded
// from a previous attempt. That is collapsed here into two lookup tables
// (`seedAnswer` + `buildAnswerPayload`), so adding a question type is one entry
// rather than a new module.
//
// ⚠️ UNVERIFIED CONTRACT — every endpoint in this flow is auth-only, so the
// field names come from the legacy renderers and Vuex modules.

/** The 8 types the legacy answer page actually registers. */
export const QUESTION_TYPES = [
  'single_choice',
  'multiple_choice',
  'true_false',
  'true_false_with_correct',
  'essay',
  'complete',
  'drag_drop_text',
  'drag_drop_image'
] as const

export type QuestionType = typeof QUESTION_TYPES[number]

export interface QuestionOption {
  id: string
  option: string
  is_correct_answer?: boolean
}

/** A sub-question (a single blank) inside a drag & drop question. */
export interface QuestionBlank {
  id: string
  question: string
  media?: { url?: string } | null
  is_correct_answer?: boolean | null
}

export interface HomeworkQuestion {
  id: string
  question_type: QuestionType
  /** HTML. For `complete` it contains the `*__*` blank marker. */
  question: string
  description?: string
  options?: QuestionOption[]
  questions?: QuestionBlank[]
  media?: { url?: string } | null
  is_answered?: boolean
  is_correct_answer?: boolean
  is_true?: boolean
  question_feedback?: string
  /** Marks this question is out of — the ceiling on an essay grade. */
  score?: number | string
  /** Previous attempt, choice-style questions. */
  selected_options?: { answer_id?: string }[]
  /** Previous attempt, free-text / true-false questions. */
  student_answer?: {
    /** The answer row's own id, which the essay-grading PUT is keyed by. */
    id?: string | number
    answer_text?: string
    answer_text_true_false?: boolean
    option_id?: string
    /** True once an instructor has already scored this essay. */
    is_reviewed?: boolean
    score?: number | string
  }[]
}

/** One blank→option mapping; the drag & drop types answer with a list of these. */
export interface BlankAnswer {
  question_id: string
  answer_id: string
}

/** Whatever the current question type stores as its answer. */
export type AnswerValue = string | boolean | null | string[] | BlankAnswer[]

export interface TrueFalseWithCorrectAnswer {
  value: boolean | null
  optionId: string | null
}

// ─────────────────────────────────────────────────────────────────────────────
// Seeding a previous attempt back into the form
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Mirrors each legacy module's `SET_QUESTION`: when the backend says the
 * question was already answered, pre-fill the input from the stored attempt.
 * Returns `undefined` when the type keeps no resumable answer (drag & drop
 * always starts empty in the legacy too).
 */
export function seedAnswer(question: HomeworkQuestion): AnswerValue | TrueFalseWithCorrectAnswer | undefined {
  if (!question.is_answered) return undefined

  const selected = question.selected_options ?? []
  const student = question.student_answer ?? []

  switch (question.question_type) {
    case 'single_choice':
      return selected[0]?.answer_id ?? null
    case 'multiple_choice':
      return selected.map(o => o.answer_id ?? '').filter(Boolean)
    case 'complete':
      // Legacy reads this one from `student_answer`, not `selected_options`,
      // in the component's `formattedQuestion()`.
      return student[0]?.answer_text ?? null
    case 'essay':
      return student[0]?.answer_text ?? null
    case 'true_false':
      // Backend sends 1/0 here, hence the loose compare in the legacy.
      return String(student[0]?.answer_text) === '1'
    case 'true_false_with_correct':
      return {
        value: student[0]?.answer_text_true_false ?? null,
        optionId: student[0]?.option_id ?? null
      }
    default:
      return undefined
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Building the submit payload
// ─────────────────────────────────────────────────────────────────────────────

interface IncludedAnswer {
  id: string
  type: 'answer'
  attributes: Record<string, unknown>
}

function envelope(questionType: QuestionType, included: IncludedAnswer[]) {
  return {
    data: [
      {
        type: 'question',
        // Overwritten with the HOMEWORK id by the store before sending — the
        // legacy does exactly that (`body.data[0].id = courseHomework.id`).
        id: '',
        attributes: { question_type: questionType },
        relationships: {
          answers: { data: included.map(a => ({ id: a.id, type: 'answer' as const })) }
        }
      }
    ],
    included
  }
}

/** Ported verbatim from each legacy module's `answerObject` getter. */
export function buildAnswerPayload(
  questionType: QuestionType,
  answer: AnswerValue | TrueFalseWithCorrectAnswer
) {
  switch (questionType) {
    case 'single_choice':
      return envelope(questionType, [
        { id: 'new_1', type: 'answer', attributes: { answer_id: answer } }
      ])

    case 'multiple_choice':
      return envelope(questionType, (Array.isArray(answer) ? answer : []).map((id, i) => ({
        id: `new_${i + 1}`,
        type: 'answer' as const,
        attributes: { answer_id: id }
      })))

    case 'true_false':
      return envelope(questionType, [
        { id: 'new_1', type: 'answer', attributes: { answer_text: answer } }
      ])

    case 'true_false_with_correct': {
      const tf = (answer ?? {}) as TrueFalseWithCorrectAnswer
      return envelope(questionType, [
        {
          id: 'new_1',
          type: 'answer',
          attributes: { answer_text: tf.value, answer_id: tf.optionId }
        }
      ])
    }

    case 'essay':
    case 'complete':
      return envelope(questionType, [
        { id: 'new_1', type: 'answer', attributes: { answer_id: null, answer_text: answer } }
      ])

    case 'drag_drop_text':
    case 'drag_drop_image':
      // Note the different id prefix — `new_answer_N`, not `new_N`.
      return envelope(questionType, (Array.isArray(answer) ? answer as BlankAnswer[] : []).map((item, i) => ({
        id: `new_answer_${i + 1}`,
        type: 'answer' as const,
        attributes: {
          single_question_id: item.question_id,
          answer_id: item.answer_id
        }
      })))
  }
}

/** Legacy `complete.vue`: the prompt is split on `*__*`, with <p> stripped. */
export function splitCompletePrompt(html: string): [string, string] {
  const parts = (html ?? '').replace(/(<p[^>]+?>|<p>|<\/p>)/gim, '').split('*__*')
  return [parts[0] ?? '', parts[1] ?? '']
}

/** True when the type needs at least one pick before submit is meaningful. */
export function hasAnswer(answer: AnswerValue | TrueFalseWithCorrectAnswer): boolean {
  if (answer == null) return false
  if (Array.isArray(answer)) return answer.length > 0
  if (typeof answer === 'string') return answer.trim().length > 0
  if (typeof answer === 'object') return (answer as TrueFalseWithCorrectAnswer).value != null
  return true
}
