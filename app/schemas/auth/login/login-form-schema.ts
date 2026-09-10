// app/schemas/auth/login/login-form-schema.ts
import { z } from 'zod'
import { requiredString, type Translator } from '~/utils/validators'

const IDENTIFIER_REGEX = /^(05\d{8}|[\w.-]+@[a-zA-Z\d.-]+\.[a-zA-Z]{2,})$/

export const useLoginFormSchema = (t: Translator) => z.object({
  identifier: requiredString(t('auth.login.identifier'), {
    pattern: IDENTIFIER_REGEX,
    patternMsg: t('auth.login.identifier_invalid')
  }, t),
  password: requiredString(t('auth.login.password'), { min: 8 }, t)
})

export type LoginFormInput = z.input<ReturnType<typeof useLoginFormSchema>>
export type LoginFormOutput = z.output<ReturnType<typeof useLoginFormSchema>>
