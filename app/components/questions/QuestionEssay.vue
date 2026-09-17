<script setup lang="ts">
// `essay` — free text.
import type { HomeworkQuestion } from '~/types/homeworkQuestion'

defineProps<{
  question: HomeworkQuestion
  disabled?: boolean
}>()

const model = defineModel<string | null>({ required: true })
</script>

<template>
  <div class="space-y-4">
    <QuestionsQuestionPrompt :question="question" />

    <UTextarea
      :model-value="model ?? ''"
      :rows="8"
      class="w-full"
      :disabled="disabled"
      :placeholder="$t('questions.your_answer')"
      @update:model-value="value => model = String(value)"
    />
  </div>
</template>
