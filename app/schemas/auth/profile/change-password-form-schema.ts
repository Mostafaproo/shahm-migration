import { z } from 'zod'
import { requiredString, sameAs, type Translator } from '~/utils/validators'

export const useChangePasswordFormSchema = (t: Translator) => sameAs(
  z.object({
    old_password: requiredString(t('user.old_password'), { min: 8 }, t),
    password: requiredString(t('user.new_password'), { min: 8 }, t),
    password_confirmation: requiredString(t('user.password_confirmation'), { min: 8 }, t)
  }),
  'password',
  'password_confirmation',
  t('user.password_confirmation'),
  t
)

export type ChangePasswordFormInput = z.input<ReturnType<typeof useChangePasswordFormSchema>>
