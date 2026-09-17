<script setup lang="ts">
// `complete` — fill in the blank. The prompt carries a `*__*` marker that the
// legacy splits on (after stripping <p> wrappers) to place the input inline.
import { splitCompletePrompt } from '~/types/homeworkQuestion'
import type { HomeworkQuestion } from '~/types/homeworkQuestion'

const props = defineProps<{
  question: HomeworkQuestion
  disabled?: boolean
  feedback?: boolean
}>()

const model = defineModel<string | null>({ required: true })

const parts = computed(() => splitCompletePrompt(props.question.question))
</script>

<template>
  <div class="space-y-4">
    <img
      v-if="question.media?.url"
      :src="question.media.url"
      alt=""
      class="max-h-64 rounded-lg object-contain"
    >

    <div class="flex flex-wrap items-center gap-2 text-base leading-loose">
      <!-- eslint-disable-next-line vue/no-v-html -- backend-authored prompt HTML -->
      <span
        v-if="parts[0]"
        v-html="parts[0]"
      />
      <UInput
        :model-value="model ?? ''"
        class="w-48"
        :disabled="disabled"
        @update:model-value="value => model = String(value)"
      />
      <!-- eslint-disable-next-line vue/no-v-html -- backend-authored prompt HTML -->
      <span
        v-if="parts[1]"
        v-html="parts[1]"
      />
    </div>

    <QuestionsQuestionFeedbackNote
      v-if="feedback"
      :question="question"
    />
  </div>
</template>
