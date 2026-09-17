import { z } from 'zod'
import { requiredString, type Translator } from '~/utils/validators'

export const useForgetPasswordFormSchema = (t: Translator) => z.object({
  identifier: requiredString(t('auth.forgot.identifier'), {}, t)
})

export type ForgetPasswordFormInput = z.input<ReturnType<typeof useForgetPasswordFormSchema>>
