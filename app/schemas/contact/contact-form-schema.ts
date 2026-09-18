import { z } from 'zod'
import { emailField, requiredString, type Translator } from '~/utils/validators'

const SAUDI_MOBILE_REGEX = /^(05)(5|0|3|6|4|9|1|8|7)([0-9]{7})$/

export const useContactFormSchema = (t: Translator) => z.object({
  first_name: requiredString(t('user.first_name'), { min: 3 }, t),
  last_name: requiredString(t('user.last_name'), { min: 3 }, t),
  email: emailField(true, t),
  mobile: requiredString(t('user.mobile'), {
    pattern: SAUDI_MOBILE_REGEX,
    patternMsg: t('auth.register.mobile_invalid')
  }, t),
  message: requiredString(t('contact.message'), { min: 5 }, t)
})

export type ContactFormInput = z.input<ReturnType<typeof useContactFormSchema>>
