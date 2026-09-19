export type AssessmentKind = 'exam' | 'assignment'

export interface AssessmentKindConfig {
  kind: AssessmentKind
  /** The `quiz_type` filter every list call sends. */
  quizTypes: string
  /** `quiz_type` values the create form offers. */
  typeOptions: string[]
  /** Default for a new one, and the fallback when the form has no picker. */
  defaultType: string
  authoringPath: string
  reportsPath: string
}

export const ASSESSMENT_KINDS: Record<AssessmentKind, AssessmentKindConfig> = {
  exam: {
    kind: 'exam',
    quizTypes: 'quiz,final_exam',
    typeOptions: ['quiz', 'final_exam'],
    defaultType: 'quiz',
    authoringPath: '/instructor/exams',
    reportsPath: '/instructor/exam-reports'
  },
  assignment: {
    kind: 'assignment',
    quizTypes: 'homework',
    typeOptions: ['homework'],
    defaultType: 'homework',
    authoringPath: '/instructor/assignments',
    reportsPath: '/instructor/assignment-reports'
  }
}

export function assessmentConfig(kind: AssessmentKind): AssessmentKindConfig {
  return ASSESSMENT_KINDS[kind]
}

export function kindKey(kind: AssessmentKind, key: string): string {
  return `instructorAssessments.${kind}.${key}`
}
