<script setup lang="ts">
import type { HomeworkQuestion, TrueFalseWithCorrectAnswer } from '~/types/homeworkQuestion'

defineProps<{
  question: HomeworkQuestion
  disabled?: boolean
  feedback?: boolean
}>()

const model = defineModel<TrueFalseWithCorrectAnswer>({ required: true })

const CHOICES = [
  { value: true, label: 'questions.true' },
  { value: false, label: 'questions.false' }
]

function setValue(value: boolean) {
  model.value = { ...model.value, value }
}

function setOption(optionId: string) {
  model.value = { ...model.value, optionId }
}
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
          model.value === choice.value ? 'border-primary bg-primary/5' : 'border-default hover:bg-elevated',
          disabled && 'cursor-not-allowed opacity-60'
        ]"
      >
        <input
          type="radio"
          :name="`q-${question.id}-tf`"
          :checked="model.value === choice.value"
          :disabled="disabled"
          class="accent-primary"
          @change="setValue(choice.value)"
        >
        <span class="font-medium">{{ $t(choice.label) }}</span>
      </label>
    </div>

    <div
      v-if="question.options?.length"
      class="space-y-2"
    >
      <p class="text-sm font-medium text-muted">
        {{ $t('questions.pick_correction') }}
      </p>
      <label
        v-for="option in question.options"
        :key="option.id"
        class="flex cursor-pointer items-start gap-3 rounded-lg border p-3 transition"
        :class="[
          model.optionId === option.id ? 'border-primary bg-primary/5' : 'border-default hover:bg-elevated',
          disabled && 'cursor-not-allowed opacity-60'
        ]"
      >
        <input
          type="radio"
          :name="`q-${question.id}-option`"
          :checked="model.optionId === option.id"
          :disabled="disabled"
          class="mt-1 accent-primary"
          @change="setOption(option.id)"
        >
        <!-- eslint-disable-next-line vue/no-v-html -- backend-authored option HTML -->
        <div
          class="prose prose-sm max-w-none flex-1"
          v-html="option.option"
        />
      </label>
    </div>

    <QuestionsQuestionFeedbackNote
      v-if="feedback"
      :question="question"
    />
  </div>
</template>
