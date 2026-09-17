<script setup lang="ts">
// `single_choice` and `multiple_choice` — one component, because the legacy's
// two files differed only in radio-vs-checkbox and scalar-vs-array binding.
import type { HomeworkQuestion } from '~/types/homeworkQuestion'

const props = defineProps<{
  question: HomeworkQuestion
  multiple: boolean
  disabled?: boolean
  feedback?: boolean
}>()

const model = defineModel<string | string[] | null>({ required: true })

function isPicked(optionId: string): boolean {
  return props.multiple
    ? Array.isArray(model.value) && model.value.includes(optionId)
    : model.value === optionId
}

/**
 * Legacy `bindCorrectionClass`: green marks the correct option, red marks a
 * wrong option the student chose. An option that is neither stays plain, so
 * the row the student picked is always distinguishable from the model answer.
 */
function feedbackClass(option: { id: string, is_correct_answer?: boolean }) {
  if (!props.feedback) return ''
  if (option.is_correct_answer) return 'border-success bg-success/10'
  return isPicked(option.id) ? 'border-error bg-error/10' : ''
}

function toggle(optionId: string) {
  if (props.disabled) return
  if (!props.multiple) {
    model.value = optionId
    return
  }
  const current = Array.isArray(model.value) ? model.value : []
  model.value = current.includes(optionId)
    ? current.filter(id => id !== optionId)
    : [...current, optionId]
}
</script>

<template>
  <div class="space-y-4">
    <QuestionsQuestionPrompt :question="question" />

    <ul class="space-y-2">
      <li
        v-for="option in question.options ?? []"
        :key="option.id"
      >
        <label
          class="flex items-start gap-3 rounded-lg border p-3 transition"
          :class="[
            feedback
              ? feedbackClass(option) || 'border-default'
              : isPicked(option.id) ? 'border-primary bg-primary/5' : 'border-default hover:bg-elevated',
            disabled || feedback ? 'cursor-default' : 'cursor-pointer',
            disabled && !feedback && 'opacity-60'
          ]"
        >
          <input
            :type="multiple ? 'checkbox' : 'radio'"
            :name="`q-${question.id}`"
            :checked="isPicked(option.id)"
            :disabled="disabled || feedback"
            class="mt-1 accent-primary"
            @change="toggle(option.id)"
          >
          <!-- eslint-disable-next-line vue/no-v-html -- backend-authored option HTML -->
          <div
            class="prose prose-sm max-w-none flex-1"
            v-html="option.option"
          />
          <UIcon
            v-if="feedback && option.is_correct_answer"
            name="i-lucide-circle-check"
            class="mt-0.5 h-5 w-5 shrink-0 text-success"
          />
        </label>
      </li>
    </ul>

    <QuestionsQuestionFeedbackNote
      v-if="feedback"
      :question="question"
    />
  </div>
</template>
