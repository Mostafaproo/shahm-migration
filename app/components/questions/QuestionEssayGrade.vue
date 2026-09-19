<script setup lang="ts">
import type { HomeworkQuestion } from '~/types/homeworkQuestion'

const props = defineProps<{
  question: HomeworkQuestion
  saving?: boolean
}>()

const emit = defineEmits<{ submit: [{ answerId: string, score: number }] }>()

const { t } = useI18n()

const answer = computed(() => props.question.student_answer?.[0])
const answerId = computed(() => String(answer.value?.id ?? ''))
const maxScore = computed(() => Number(props.question.score ?? 0) || 0)
const isReviewed = computed(() => Boolean(answer.value?.is_reviewed))

/**
 * Shown only for an essay the student actually attempted and nobody has scored
 * yet. Without an answer id there is nothing to PUT to, so the form would be a
 * dead end.
 */
const canGrade = computed(() =>
  props.question.question_type === 'essay'
  && Boolean(props.question.is_answered)
  && Boolean(answerId.value)
  && !isReviewed.value
)

const score = ref<number | null>(null)

const error = computed(() => {
  if (score.value == null) return null
  if (score.value < 0) return t('instructorReports.grade_min')
  if (maxScore.value && score.value > maxScore.value) {
    return t('instructorReports.grade_max', { max: maxScore.value })
  }
  return null
})

function submit() {
  if (score.value == null || error.value) return
  emit('submit', { answerId: answerId.value, score: score.value })
}

// A fresh box per question, otherwise the previous grade follows the reader on.
watch(() => props.question, () => {
  score.value = null
})
</script>

<template>
  <div
    v-if="isReviewed"
    class="flex items-center gap-2 rounded-xl border border-success/40 bg-success/5 p-4 text-sm text-success"
  >
    <UIcon
      name="i-lucide-check-circle"
      class="h-4 w-4 shrink-0"
    />
    <span>
      {{ t('instructorReports.already_graded') }}
      <template v-if="answer?.score != null">— {{ answer.score }}</template>
    </span>
  </div>

  <form
    v-else-if="canGrade"
    class="space-y-3 rounded-xl border border-default bg-elevated p-4"
    @submit.prevent="submit"
  >
    <p class="text-sm font-semibold">
      {{ t('instructorReports.grade_answer') }}
    </p>

    <div class="flex flex-wrap items-start gap-3">
      <UFormField
        :error="error ?? undefined"
        :hint="maxScore ? t('instructorReports.out_of', { max: maxScore }) : undefined"
        class="w-40"
      >
        <UInput
          v-model.number="score"
          type="number"
          min="0"
          step="0.01"
          :max="maxScore || undefined"
          class="w-full"
          :placeholder="t('instructorReports.score')"
        />
      </UFormField>

      <UButton
        type="submit"
        :loading="saving"
        :disabled="score == null || Boolean(error)"
      >
        {{ t('instructorReports.save_grade') }}
      </UButton>
    </div>
  </form>
</template>
