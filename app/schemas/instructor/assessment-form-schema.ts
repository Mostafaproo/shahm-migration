import { z } from 'zod'
import { kindKey } from '~/types/assessmentKind'
import type { AssessmentKind } from '~/types/assessmentKind'
import { requiredString, type Translator } from '~/utils/validators'

/**
 * The exam / homework form. Every field the legacy marks
 * `rules="{ required: true }"` is required here; `random_question` is the one
 * optional field.
 *
 * `kind` only changes the wording of two field names in the error messages —
 * "عنوان الاختبار" vs "عنوان الواجب" — so the rules themselves stay shared.
 *
 * `end_at` is checked against `start_at`, which the legacy never did: it let
 * an instructor publish something that closed before it opened.
 */
export const useAssessmentFormSchema = (t: Translator, kind: AssessmentKind) => z.object({
  title: requiredString(t(kindKey(kind, 'title_label')), { min: 3 }, t),
  course_id: requiredString(t('instructorAssessments.course'), {}, t),
  start_at: requiredString(t('instructorAssessments.start_date'), {}, t),
  end_at: requiredString(t('instructorAssessments.end_date'), {}, t),
  quiz_type: requiredString(t(kindKey(kind, 'test_type')), {}, t),
  random_question: z.boolean()
}).refine(
  values => !values.start_at || !values.end_at || values.end_at > values.start_at,
  { path: ['end_at'], message: t('instructorAssessments.end_before_start') }
)

export type AssessmentFormInput = z.input<ReturnType<typeof useAssessmentFormSchema>>
