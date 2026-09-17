import { z } from 'zod'
import { requiredString, type Translator } from '~/utils/validators'

export const useProfileFormSchema = (t: Translator) => z.object({
  first_name: requiredString(t('user.first_name'), { min: 3 }, t),
  last_name: requiredString(t('user.last_name'), { min: 3 }, t)
})

export type ProfileFormInput = z.input<ReturnType<typeof useProfileFormSchema>>
