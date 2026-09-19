import { z } from 'zod'
import { requiredString, type Translator } from '~/utils/validators'


export const useHomeworkFormSchema = (t: Translator) => z.object({
  title: requiredString(t('instructorHomeworks.title_label'), { min: 3 }, t),
  course_id: requiredString(t('instructorHomeworks.course'), {}, t),
  start_at: requiredString(t('instructorHomeworks.start_date'), {}, t),
  end_at: requiredString(t('instructorHomeworks.end_date'), {}, t),
  quiz_type: requiredString(t('instructorHomeworks.test_type'), {}, t),
  random_question: z.boolean()
}).refine(
  values => !values.start_at || !values.end_at || values.end_at > values.start_at,
  { path: ['end_at'], message: t('instructorHomeworks.end_before_start') }
)

export type HomeworkFormInput = z.input<ReturnType<typeof useHomeworkFormSchema>>
