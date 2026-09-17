<script setup lang="ts">
// `true_false` — a plain صح/خطأ pick.
import type { HomeworkQuestion } from '~/types/homeworkQuestion'

defineProps<{
  question: HomeworkQuestion
  disabled?: boolean
  feedback?: boolean
}>()

const model = defineModel<boolean | null>({ required: true })

const CHOICES = [
  { value: true, label: 'questions.true' },
  { value: false, label: 'questions.false' }
]
</script>

<template>
  <div class="space-y-4">
    <QuestionsQuestionPrompt :question="question" />

    <div class="flex flex-wrap gap-3">
      <label
        v-for="choice in CHOICES"
        :key="String(choice.value)"
        class="flex flex-1 cursor-pointer items-center justify-center gap-2 rounded-lg border p-3 transition"
        :class="[
          model === choice.value ? 'border-primary bg-primary/5' : 'border-default hover:bg-elevated',
          disabled && 'cursor-not-allowed opacity-60'
        ]"
      >
        <input
          type="radio"
          :name="`q-${question.id}`"
          :checked="model === choice.value"
          :disabled="disabled"
          class="accent-primary"
          @change="model = choice.value"
        >
        <span class="font-medium">{{ $t(choice.label) }}</span>
      </label>
    </div>

    <QuestionsQuestionFeedbackNote
      v-if="feedback"
      :question="question"
    />
  </div>
</template>
