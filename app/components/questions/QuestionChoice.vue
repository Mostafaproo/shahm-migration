<script setup lang="ts">
// `single_choice` and `multiple_choice` — one component, because the legacy's
// two files differed only in radio-vs-checkbox and scalar-vs-array binding.
import type { HomeworkQuestion } from '~/types/homeworkQuestion'

const props = defineProps<{
  question: HomeworkQuestion
  multiple: boolean
  disabled?: boolean
}>()

const model = defineModel<string | string[] | null>({ required: true })

function isPicked(optionId: string): boolean {
  return props.multiple
    ? Array.isArray(model.value) && model.value.includes(optionId)
    : model.value === optionId
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
          class="flex cursor-pointer items-start gap-3 rounded-lg border p-3 transition"
          :class="[
            isPicked(option.id) ? 'border-primary bg-primary/5' : 'border-default hover:bg-elevated',
            disabled && 'cursor-not-allowed opacity-60'
          ]"
        >
          <input
            :type="multiple ? 'checkbox' : 'radio'"
            :name="`q-${question.id}`"
            :checked="isPicked(option.id)"
            :disabled="disabled"
            class="mt-1 accent-primary"
            @change="toggle(option.id)"
          >
          <!-- eslint-disable-next-line vue/no-v-html -- backend-authored option HTML -->
          <div
            class="prose prose-sm max-w-none flex-1"
            v-html="option.option"
          />
        </label>
      </li>
    </ul>
  </div>
</template>
