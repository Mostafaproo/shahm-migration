<script setup lang="ts">
import { EXAM_QUESTION_TYPES } from '~/types/instructorExamQuestion'
import type { ExamQuestionOption } from '~/types/instructorExamQuestion'

const props = defineProps<{
  /** Absent when creating. */
  questionId?: string
}>()

const store = useInstructorExamQuestionsStore()
const localePath = useLocalePath()
const { t } = useI18n()
const { $appToast: toast } = useNuxtApp()

const isEdit = computed(() => Boolean(props.questionId))

const typeItems = computed(() => EXAM_QUESTION_TYPES.map(value => ({
  label: t(`instructorExamQuestions.types.${value}`),
  value: value as string
})))

const form = reactive({
  questionType: '',
  title: '',
  description: '',
  correctAnswerDescription: '',
  instruction: '',
  isActive: true
})

/** The legacy starts at two and never lets you go below two. */
const options = ref<ExamQuestionOption[]>([
  { id: null, option: '', isCorrect: false },
  { id: null, option: '', isCorrect: false }
])

const canRemoveOption = computed(() => options.value.length > 2)
const hasCorrectOption = computed(() => options.value.some(o => o.isCorrect))

function addOption() {
  options.value = [...options.value, { id: null, option: '', isCorrect: false }]
}

function removeOption(index: number) {
  if (!canRemoveOption.value) return
  options.value = options.value.filter((_, i) => i !== index)
}

/** Single choice: picking one clears every other. */
function pickCorrect(index: number) {
  options.value = options.value.map((option, i) => ({ ...option, isCorrect: i === index }))
}

function validate(): string | null {
  if (!form.questionType) return t('instructorExamQuestions.type_required')
  if (!form.title.trim()) return t('instructorExamQuestions.title_required')
  if (!form.description.trim()) return t('instructorExamQuestions.description_required')
  if (!form.correctAnswerDescription.trim()) return t('instructorExamQuestions.answer_description_required')
  if (!form.instruction.trim()) return t('instructorExamQuestions.instruction_required')
  if (options.value.some(o => !o.option.trim())) return t('instructorExamQuestions.options_required')
  if (!hasCorrectOption.value) return t('instructorExamQuestions.correct_required')
  return null
}

async function onSubmit() {
  const error = validate()
  if (error) {
    toast.warning(error)
    return
  }

  const payload = {
    questionType: form.questionType,
    title: form.title,
    description: form.description,
    correctAnswerDescription: form.correctAnswerDescription,
    instruction: form.instruction,
    isActive: form.isActive,
    options: options.value
  }

  const ok = isEdit.value
    ? await store.update(props.questionId!, payload)
    : await store.create(payload)
  if (!ok) return

  if (isEdit.value) {
    await navigateTo(localePath('/instructor/computerized-test'))
    return
  }
  // Creating stays put and clears, so a bank can be filled in one sitting —
  // which is what the legacy does too.
  reset()
}

function reset() {
  Object.assign(form, {
    questionType: '',
    title: '',
    description: '',
    correctAnswerDescription: '',
    instruction: '',
    isActive: true
  })
  options.value = [
    { id: null, option: '', isCorrect: false },
    { id: null, option: '', isCorrect: false }
  ]
}

onMounted(async () => {
  store.resetOne()
  if (!props.questionId) return
  await store.fetchOne(props.questionId)
  const row = store.current
  if (!row) return
  Object.assign(form, {
    questionType: row.questionType,
    title: row.title,
    description: row.description,
    correctAnswerDescription: row.correctAnswerDescription,
    instruction: row.instruction,
    isActive: row.isActive
  })
  if (row.options.length) options.value = row.options.map(o => ({ ...o }))
})
</script>

<template>
  <div class="mx-auto max-w-4xl space-y-5">
    <div class="flex flex-wrap items-center justify-between gap-3">
      <UButton
        :to="localePath('/instructor/computerized-test')"
        color="neutral"
        variant="ghost"
        icon="i-lucide-arrow-right"
        class="ltr:[&_span:first-child]:rotate-180"
      >
        {{ t('instructorExamQuestions.back') }}
      </UButton>
    </div>

    <div class="space-y-1">
      <h1 class="text-xl font-bold">
        {{ isEdit
          ? t('instructorExamQuestions.edit_title')
          : t('instructorExamQuestions.create_title') }}
      </h1>
      <p class="text-sm text-muted">
        {{ t('instructorExamQuestions.form_info') }}
      </p>
    </div>

    <div
      v-if="store.isLoadingOne"
      class="space-y-4 rounded-xl border border-default bg-default p-6"
    >
      <USkeleton
        v-for="n in 6"
        :key="n"
        class="h-11 w-full"
      />
    </div>

    <form
      v-else
      class="space-y-5 rounded-xl border border-default bg-default p-6"
      @submit.prevent="onSubmit"
    >
      <UFormField
        :label="t('instructorExamQuestions.question_type')"
        required
      >
        <USelectMenu
          v-model="form.questionType"
          :items="typeItems"
          value-key="value"
          class="w-full"
          :placeholder="t('instructorExamQuestions.question_type')"
        />
      </UFormField>

      <UFormField
        :label="t('instructorExamQuestions.question_title')"
        required
      >
        <UInput
          v-model="form.title"
          class="w-full"
          :placeholder="t('instructorExamQuestions.question_title')"
        />
      </UFormField>

      <UFormField
        :label="t('instructorExamQuestions.question_description')"
        required
      >
        <SharedEditorAppRichTextEditor v-model="form.description" />
      </UFormField>

      <UFormField
        :label="t('instructorExamQuestions.correct_answer_description')"
        required
      >
        <SharedEditorAppRichTextEditor v-model="form.correctAnswerDescription" />
      </UFormField>

      <UFormField
        :label="t('instructorExamQuestions.question_instruction')"
        required
      >
        <SharedEditorAppRichTextEditor v-model="form.instruction" />
      </UFormField>

      <!-- Options -->
      <div class="space-y-3 border-t border-default pt-4">
        <div class="flex flex-wrap items-center justify-between gap-2">
          <span class="font-semibold">{{ t('instructorExamQuestions.options') }}</span>
          <UButton
            color="neutral"
            variant="outline"
            size="sm"
            icon="i-lucide-plus"
            @click="addOption"
          >
            {{ t('instructorExamQuestions.add_option') }}
          </UButton>
        </div>

        <div
          v-for="(option, index) in options"
          :key="index"
          class="space-y-2 rounded-xl border border-default p-4"
          :class="option.isCorrect ? 'border-primary bg-primary/5' : ''"
        >
          <div class="flex flex-wrap items-center justify-between gap-2">
            <span class="text-sm font-medium text-muted">
              {{ t('instructorExamQuestions.option_n', { n: index + 1 }) }}
            </span>
            <div class="flex items-center gap-3">
              <!-- A native radio rather than URadio: Nuxt UI v4 only ships
                   URadioGroup, and one group per option row would defeat the
                   point — these rows are one group spread across the form.
                   `accent-color` paints it in the tenant's primary. -->
              <label class="flex cursor-pointer items-center gap-2">
                <input
                  type="radio"
                  name="correct-option"
                  class="size-6 cursor-pointer accent-primary"
                  :checked="option.isCorrect"
                  @change="pickCorrect(index)"
                >
                <span class="text-base font-medium">
                  {{ t('instructorExamQuestions.correct_answer') }}
                </span>
              </label>
              <UButton
                v-if="canRemoveOption"
                size="xs"
                variant="ghost"
                color="error"
                icon="i-lucide-trash-2"
                :aria-label="t('instructorExamQuestions.delete_option')"
                @click="removeOption(index)"
              />
            </div>
          </div>
          <SharedEditorAppRichTextEditor v-model="option.option" />
        </div>
      </div>

      <UCheckbox
        v-model="form.isActive"
        :label="t('instructorExamQuestions.is_active')"
      />

      <div class="flex justify-end">
        <UButton
          type="submit"
          size="lg"
          :loading="store.isSubmitting"
        >
          {{ isEdit
            ? t('instructorExamQuestions.save')
            : t('instructorExamQuestions.submit') }}
        </UButton>
      </div>
    </form>
  </div>
</template>
