// app/schemas/auth/register/register-form-schema.ts
import { z } from 'zod'
import { mustBeTrue, requiredString, sameAs, type Translator } from '~/utils/validators'

const NAME_REGEX = /^[؀-ۿݐ-ݿ a-zA-Z]+$/
const SAUDI_MOBILE_REGEX = /^(05)(5|0|3|6|4|9|1|8|7)([0-9]{7})$/

export const useRegisterFormSchema = (t: Translator) => sameAs(
  z.object({
    first_name: requiredString(t('auth.register.name'), {
      min: 3,
      pattern: NAME_REGEX,
      patternMsg: t('auth.register.name_invalid')
    }, t),
    mobile: requiredString(t('auth.register.mobile'), {
      pattern: SAUDI_MOBILE_REGEX,
      patternMsg: t('auth.register.mobile_invalid')
    }, t),
    password: requiredString(t('auth.register.password'), { min: 8 }, t),
    password_confirmation: requiredString(t('auth.register.password_confirmation'), { min: 8 }, t),
    termsAndConditions: mustBeTrue(t('auth.register.terms_link'), t)
  }),
  'password',
  'password_confirmation',
  t('auth.register.password_confirmation'),
  t
)

export type RegisterFormInput = z.input<ReturnType<typeof useRegisterFormSchema>>
export type RegisterFormOutput = z.output<ReturnType<typeof useRegisterFormSchema>>
