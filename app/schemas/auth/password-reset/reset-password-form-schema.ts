import { z } from 'zod'
import { requiredString, sameAs, type Translator } from '~/utils/validators'

export const useResetPasswordFormSchema = (t: Translator) => sameAs(
  z.object({
    password: requiredString(t('user.new_password'), { min: 8 }, t),
    password_confirmation: requiredString(t('user.password_confirmation'), { min: 8 }, t)
  }),
  'password',
  'password_confirmation',
  t('user.password_confirmation'),
  t
)

export type ResetPasswordFormInput = z.input<ReturnType<typeof useResetPasswordFormSchema>>
