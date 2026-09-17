<script setup lang="ts">
import type { HomeworkQuestion } from '~/types/homeworkQuestion'

const props = defineProps<{ question: HomeworkQuestion }>()

const verdict = computed(() => {
  if (!props.question.is_answered) {
    return { key: 'questions.not_answered', color: 'neutral' as const, icon: 'i-lucide-circle-help' }
  }
  return props.question.is_correct_answer
    ? { key: 'questions.correct_answer', color: 'success' as const, icon: 'i-lucide-circle-check' }
    : { key: 'questions.wrong_answer', color: 'error' as const, icon: 'i-lucide-circle-x' }
})
</script>

<template>
  <div class="space-y-3">
    <UBadge
      :color="verdict.color"
      variant="subtle"
      :icon="verdict.icon"
    >
      {{ $t(verdict.key) }}
    </UBadge>

    <div
      v-if="question.question_feedback"
      class="rounded-lg border border-default bg-elevated p-3"
    >
      <p class="mb-1 text-sm font-medium">
        {{ $t('questions.explanation') }}
      </p>
      <!-- eslint-disable-next-line vue/no-v-html -- backend-authored feedback -->
      <div
        class="prose prose-sm max-w-none text-muted"
        v-html="question.question_feedback"
      />
    </div>
  </div>
</template>
