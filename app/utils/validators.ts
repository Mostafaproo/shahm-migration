// app/utils/validators.ts
//
// Ported from ouredu-lms-monorepo's packages/nuxt-base/app/utils/validators.ts.
import { z } from 'zod'

function normalizePhone(value: string): string {
  return value.replace(/[\s\-().]/g, '')
}

const emptyableOptional = <T extends z.ZodTypeAny>(schema: T) =>
  schema.optional().or(z.literal(''))

// ─── Constants ────────────────────────────────────────────────────────────────

const ACCEPTED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp']
const ACCEPTED_DOC_TYPES = [
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
]
const MAX_FILE_SIZE = 5 * 1024 * 1024 // 5MB

// ─── Translator ───────────────────────────────────────────────────────────────

type Translator = (key: string, params?: Record<string, unknown>) => string

// ─── Regex Patterns ───────────────────────────────────────────────────────────

const ARABIC_REGEX = /^[؀-ۿݐ-ݿࢠ-ࣿ0-9\s]+$/
const ENGLISH_REGEX = /^[a-zA-Z0-9\s'’]+$/
const NATIONAL_ID_REGEX = /^[A-Za-z0-9]{8,16}$/
const OTP_REGEX = /^\d{6}$/
const PASSWORD_REGEX
  = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&^#()_\-+=[\]{};:'",.<>/?\\|`~])[A-Za-z\d@$!%*?&^#()_\-+=[\]{};:'",.<>/?\\|`~]{8,}$/

// ─── Passport format ──────────────────────────────────────────
const PASSPORT_REGEX = /^[A-Z]{1,3}[A-Z0-9]{5,8}$/

// ─── Root cause explanation ───────────────────────────────────────────────────
// ═══════════════════════════════════════════════════════════════════════════════
// STRING VALIDATORS
// ═══════════════════════════════════════════════════════════════════════════════

const requiredString = (
  field: string,
  opts: {
    min?: number
    max?: number
    pattern?: RegExp
    patternMsg?: string
  } = {},
  t: Translator
) => {
  let schema = z
    .string({ message: t('validation.requiredField', { field }) })
    .min(1, { message: t('validation.requiredField', { field }) })

  if (opts.min !== undefined)
    schema = schema.min(opts.min, {
      message: t('validation.minLength', { field, min: opts.min })
    })

  if (opts.max !== undefined)
    schema = schema.max(opts.max, {
      message: t('validation.maxLength', { field, max: opts.max })
    })

  if (opts.pattern)
    schema = schema.regex(opts.pattern, {
      message: opts.patternMsg ?? t('validation.invalidFormat', { field })
    })

  return schema
}

/**
 * Optional string with optional max length.
 */
const optionalString = (max: number | undefined, t: Translator) => {
  const base = z.string().optional()
  if (max !== undefined)
    return base.refine(v => v === undefined || v.length <= max, {
      message: t('validation.maxLength', { field: '', max })
    })
  return base
}

// ─── Language-specific ────────────────────────────────────────────────────────

const arabicString = (
  field: string,
  opts: { min?: number, max?: number, required?: boolean } = {},
  t: Translator
) => {
  const required = opts.required ?? true
  let schema = z
    .string({ message: t('validation.requiredField', { field }) })
    .min(1, { message: t('validation.requiredField', { field }) })
    .regex(ARABIC_REGEX, { message: t('validation.arabicOnly', { field }) })

  if (opts.min !== undefined)
    schema = schema.min(opts.min, {
      message: t('validation.minLength', { field, min: opts.min })
    })

  if (opts.max !== undefined)
    schema = schema.max(opts.max, {
      message: t('validation.maxLength', { field, max: opts.max })
    })

  return required ? schema : schema.optional()
}

/**
 * Accepts only English (Latin a–z, A–Z) characters, digits, spaces and
 * apostrophes (`'` / `’`).
 * Order: required → regex → min → max
 */
const englishString = (
  field: string,
  opts: { min?: number, max?: number, required?: boolean } = {},
  t: Translator
) => {
  const required = opts.required ?? true
  let schema = z
    .string({ message: t('validation.requiredField', { field }) })
    .min(1, { message: t('validation.requiredField', { field }) })
    .regex(ENGLISH_REGEX, { message: t('validation.englishOnly', { field }) })

  if (opts.min !== undefined)
    schema = schema.min(opts.min, {
      message: t('validation.minLength', { field, min: opts.min })
    })

  if (opts.max !== undefined)
    schema = schema.max(opts.max, {
      message: t('validation.maxLength', { field, max: opts.max })
    })

  return required ? schema : schema.optional()
}

// ═══════════════════════════════════════════════════════════════════════════════
// CONTACT VALIDATORS
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Email address.
 * Order: required → email format
 */
const emailField = (required = true, t: Translator) => {
  if (!required) {
    return emptyableOptional(
      z.string().email({ message: t('validation.emailInvalid') })
    )
  }
  return z
    .string({ message: t('validation.emailRequired') })
    .min(1, { message: t('validation.emailRequired') })
    .email({ message: t('validation.emailInvalid') })
}

/**
 * Phone number — required check only.
 * Format/correctness is expected to be validated by a phone input component
 * (e.g. vue-tel-input) which does real per-country validation internally.
 */
const phoneField = (required = true, t: Translator) => {
  if (!required) {
    return z.string().optional()
  }
  return z
    .string({ message: t('validation.phoneRequired') })
    .min(1, { message: t('validation.phoneRequired') })
}

/**
 * National / government ID (8–16 digits).
 * Order: required → regex pattern
 */
const nationalIdField = (
  required = true,
  t: Translator,
  field: string = 'NationalId'
) => {
  const schema = z
    .string({ message: t('validation.nationalIdRequired', { field }) })
    .min(1, { message: t('validation.nationalIdRequired', { field }) })
    .regex(NATIONAL_ID_REGEX, {
      message: t('validation.nationalIdInvalid', { field })
    })

  return required ? schema : schema.optional()
}

/**
 * OTP code — exactly 6 digits, no letters or spaces.
 *
 * Regex: /^\d{6}$/
 *
 * @example
 * otp: otpField(t)
 */

const otpField = (t: Translator) => {
  const schema = z
    .preprocess((val) => {
      if (val === null || val === undefined) return ''
      if (Array.isArray(val)) return val.join('')
      return String(val).replace(/\D/g, '')
    }, z.string())
    .superRefine((value, ctx) => {
      if (value.length === 0) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: t('validation.otpRequired')
        })
        return
      }
      if (!OTP_REGEX.test(value)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: t('validation.otpInvalid')
        })
      }
    })

  return schema as unknown as z.ZodType<string>
}


const passportField = (required = true, t: Translator, field?: string) => {
  const schema = z
    .string({ message: t('validation.passportRequired', { field }) })
    .min(1, { message: t('validation.passportRequired', { field }) })
    .transform(val => val.trim().toUpperCase())
    .refine(val => PASSPORT_REGEX.test(val), {
      message: t('validation.passportInvalid', { field })
    })

  return required ? schema : schema.optional()
}

// ═══════════════════════════════════════════════════════════════════════════════
// NUMBER VALIDATORS
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Generic numeric field with optional min/max value.
 *
 * @example
 * numberField('Score', { min: 0, max: 100 }, t)
 * numberField('GPA',   { min: 0, max: 4 },   t)   // decimals work natively
 */
const numberField = (
  field: string,
  opts: { min?: number, max?: number, required?: boolean } = {},
  t: Translator
) => {
  const required = opts.required ?? true

  const schema = z
    .preprocess(
      val => (val === '' || val === null ? undefined : val),
      z.union([z.number(), z.undefined()])
    )
    .superRefine((val, ctx) => {
      if (val === undefined) {
        if (required)
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: t('validation.requiredField', { field })
          })
        return
      }
      if (typeof val !== 'number' || Number.isNaN(val)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: t('validation.numberInvalid', { field })
        })
        return
      }
      if (opts.min !== undefined && val < opts.min)
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: t('validation.numberMin', { field, min: opts.min })
        })

      if (opts.max !== undefined && val > opts.max)
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: t('validation.numberMax', { field, max: opts.max })
        })
    })

  return schema as unknown as z.ZodType<number | undefined>
}

// ═══════════════════════════════════════════════════════════════════════════════
// DATE VALIDATORS
// ═══════════════════════════════════════════════════════════════════════════════

const DEFAULT_MIN_YEAR = 1900
const DEFAULT_MAX_YEAR = 2100

function parseStrictDate(
  val: unknown,
  opts: { minYear?: number, maxYear?: number } = {}
): Date | null {
  const minYear = opts.minYear ?? DEFAULT_MIN_YEAR
  const maxYear = opts.maxYear ?? DEFAULT_MAX_YEAR

  if (val instanceof Date) {
    if (Number.isNaN(val.getTime())) return null
    const y = val.getFullYear()
    return y >= minYear && y <= maxYear ? val : null
  }

  if (typeof val !== 'string') return null
  const trimmed = val.trim()
  if (trimmed === '') return null

  let year: number, month: number, day: number

  // ISO format: YYYY-MM-DD — what <input type="date"> always sends
  let m = trimmed.match(/^(\d{4})-(\d{2})-(\d{2})$/)
  if (m) {
    year = Number(m[1])
    month = Number(m[2])
    day = Number(m[3])
  } else {
    // US slash format: MM/DD/YYYY — year MUST be exactly 4 digits.
    m = trimmed.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/)
    if (m) {
      month = Number(m[1])
      day = Number(m[2])
      year = Number(m[3])
    } else {
      return null
    }
  }

  if (year < minYear || year > maxYear) return null
  if (month < 1 || month > 12) return null
  if (day < 1 || day > 31) return null

  // Build via Date.UTC — no silent rollover; verify components match afterward
  // to catch edge cases like Feb 30, Apr 31, etc.
  const d = new Date(Date.UTC(year, month - 1, day))
  if (
    d.getUTCFullYear() !== year
    || d.getUTCMonth() + 1 !== month
    || d.getUTCDate() !== day
  ) {
    return null
  }

  return d
}

const dateField = (
  field: string,
  opts: { minYear?: number, maxYear?: number, required?: boolean } = {},
  dateType: 'any' | 'past' | 'future' = 'any',
  t: Translator
) => {
  const required = opts.required ?? true
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const schema = z
    .preprocess(
      (val) => {
        if (val === '' || val === null || val === undefined) return undefined
        return parseStrictDate(val, opts)
      },
      z.union([z.date(), z.null(), z.undefined()])
    )
    .superRefine((val, ctx) => {
      if (val === undefined) {
        if (required)
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: t('validation.dateRequired', { field })
          })
        return
      }
      if (val === null) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: t('validation.dateInvalid', { field })
        })
        return
      }
      if (dateType === 'past' && val >= today) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: t('validation.datePast', { field })
        })
        return
      }
      if (dateType === 'future' && val < today) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: t('validation.dateFuture', { field })
        })
        return
      }
    })

  return schema as unknown as z.ZodType<Date | undefined>
}


const dateRange
  = (t: Translator, keys: { start?: string, end?: string } = {}) =>
    (data: Record<string, unknown>, ctx: z.RefinementCtx) => {
      const startKey = keys.start ?? 'startDate'
      const endKey = keys.end ?? 'endDate'
      const start = data[startKey]
      const end = data[endKey]
      if (!start || !end) return
      const s
        = start instanceof Date ? start.getTime() : Date.parse(String(start))
      const e = end instanceof Date ? end.getTime() : Date.parse(String(end))
      if (e < s) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: [endKey],
          message: t('validation.dateRangeInvalid')
        })
      }
    }

// ═══════════════════════════════════════════════════════════════════════════════
// ENUM / SELECT VALIDATORS
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Single enum value (radio / select).
 *
 * @example
 * const values = ['admin', 'teacher', 'student'] as const
 * role: enumField(values, 'User role', true, t)
 */
const enumField = <T extends [string, ...string[]]>(
  values: T,
  label: string,
  required = true,
  t: Translator
) => {
  const schema = z
    .preprocess(
      val => (val === '' || val === null ? undefined : val),
      z.any()
    )
    .superRefine((val, ctx) => {
      if (val === undefined) {
        if (required)
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: t('validation.selectRequired', { label })
          })
        return
      }
      if (!values.includes(val as string))
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: t('validation.selectInvalid', { label })
        })
    })

  return schema as unknown as z.ZodType<T[number] | undefined>
}


const optionsEnum = <T extends readonly { label: string, value: string }[]>(
  options: T,
  label: string,
  required = true,
  t: Translator
) => {
  const values = options.map(o => o.value)

  const schema = z
    .preprocess(
      val => (val === '' || val === null ? undefined : val),
      z.any()
    )
    .superRefine((val, ctx) => {
      if (val === undefined) {
        if (required)
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: t('validation.selectRequired', { label })
          })
        return
      }
      if (!values.includes(val as string))
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: t('validation.selectInvalid', { label })
        })
    })

  return schema as unknown as z.ZodType<T[number]['value'] | undefined>
}

/**
 * Multiple enum values (checkbox group).
 */
const multiEnumField = <T extends [string, ...string[]]>(
  values: T,
  label: string,
  opts: { min?: number, max?: number, required?: boolean } = {},
  t: Translator
) => {
  const required = opts.required ?? true
  const min = opts.min ?? (required ? 1 : 0)

  let schema = z.array(z.enum(values))

  if (min > 0)
    schema = schema.min(min, {
      message: t('validation.multiSelectMin', { min, label })
    })

  if (opts.max !== undefined)
    schema = schema.max(opts.max, {
      message: t('validation.multiSelectMax', { max: opts.max, label })
    })

  return required ? schema : schema.optional()
}

// ═══════════════════════════════════════════════════════════════════════════════
// BOOLEAN VALIDATORS
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Checkbox that must be checked. Mirrors Vuelidate's sameAs(true).
 */
const mustBeTrue = (field = 'This field', t: Translator) =>
  z.any().superRefine((val, ctx) => {
    if (val !== true) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: t('validation.mustBeAccepted', { field })
      })
    }
  })

// ═══════════════════════════════════════════════════════════════════════════════
// CROSS-FIELD: sameAs
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Cross-field equality check (like Vuelidate's sameAs).
 * Uses .refine() so it always runs even when other fields have errors.
 */
const sameAs = <T extends z.ZodRawShape>(
  schema: z.ZodObject<T>,
  sourceField: keyof T & string,
  targetField: keyof T & string,
  label: string,
  t: Translator
) =>
  schema.refine(
    (data) => {
      const record = data as Record<string, unknown>
      return record[sourceField] === record[targetField]
    },
    {
      message: t('validation.fieldsDoNotMatch', { label }),
      path: [targetField]
    }
  )

// ═══════════════════════════════════════════════════════════════════════════════
// FILE VALIDATORS
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Generic file validator with size and type checks.
 */
const fileSchema = (
  opts: { required?: boolean, maxSize?: number, acceptedTypes?: string[] } = {},
  t: Translator
) => {
  const maxSize = opts.maxSize ?? MAX_FILE_SIZE
  const accepted = opts.acceptedTypes ?? [
    ...ACCEPTED_IMAGE_TYPES,
    ...ACCEPTED_DOC_TYPES
  ]
  const required = opts.required ?? false

  const base = z
    .instanceof(File, { message: t('validation.fileRequired') })
    .refine(f => f === undefined || f.size <= maxSize, {
      message: t('validation.fileMaxSize', {
        size: Math.round(maxSize / 1024 / 1024)
      })
    })
    .refine(f => f === undefined || accepted.includes(f.type), {
      message: t('validation.fileInvalidType', { types: accepted.join(', ') })
    })

  return required ? base : base.optional()
}

/**
 * Image-only file validator (JPEG, PNG, WEBP).
 */
const imageSchema = (
  opts: { required?: boolean, maxSize?: number } = {},
  t: Translator
) => fileSchema({ ...opts, acceptedTypes: ACCEPTED_IMAGE_TYPES }, t)

/**
 * Document-only file validator (PDF, DOC, DOCX).
 */
const documentSchema = (
  opts: { required?: boolean, maxSize?: number } = {},
  t: Translator
) => fileSchema({ ...opts, acceptedTypes: ACCEPTED_DOC_TYPES }, t)

// ═══════════════════════════════════════════════════════════════════════════════
// SECURITY VALIDATORS
// ═══════════════════════════════════════════════════════════════════════════════

const passwordField = (
  field = 'Password',
  opts: {
    min?: number
    max?: number
    required?: boolean
    strengthCheck?: boolean
  } = {},
  t: Translator
) => {
  const required = opts.required ?? true
  const strengthCheck = opts.strengthCheck ?? true

  const schema = z
    .string({ message: t('validation.requiredField', { field }) })
    .min(1, { message: t('validation.requiredField', { field }) })
    .superRefine((value, ctx) => {
      if (opts.min !== undefined && value.length < opts.min) {
        ctx.addIssue({
          code: z.ZodIssueCode.too_small,
          minimum: opts.min,
          inclusive: true,
          origin: 'string',
          message: t('validation.minLength', { field, min: opts.min })
        })
        return
      }

      if (opts.max !== undefined && value.length > opts.max) {
        ctx.addIssue({
          code: z.ZodIssueCode.too_big,
          maximum: opts.max,
          inclusive: true,
          origin: 'string',
          message: t('validation.maxLength', { field, max: opts.max })
        })
        return
      }

      if (strengthCheck && !PASSWORD_REGEX.test(value)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: t('validation.passwordInvalid')
        })
      }
    })

  return required ? schema : schema.optional()
}

export {
  type Translator,

  normalizePhone,

  requiredString,
  optionalString,
  arabicString,
  englishString,
  emailField,
  phoneField,
  nationalIdField,
  otpField,
  passportField,
  numberField,
  dateField,
  dateRange,
  enumField,
  optionsEnum,
  multiEnumField,
  mustBeTrue,
  sameAs,
  fileSchema,
  imageSchema,
  documentSchema,
  passwordField
}
