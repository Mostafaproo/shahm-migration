<script setup lang="ts">
// Shared question header: the media (if any) and the prompt HTML.
// Ported from the legacy `question-media.vue` + `QuestionInfo.vue` pair, which
// every renderer pulled in.
import type { HomeworkQuestion } from '~/types/homeworkQuestion'

defineProps<{ question: HomeworkQuestion }>()
</script>

<template>
  <div class="space-y-3">
    <img
      v-if="question.media?.url"
      :src="question.media.url"
      alt=""
      class="max-h-64 rounded-lg object-contain"
    >
    <!-- eslint-disable-next-line vue/no-v-html -- backend-authored question HTML -->
    <div
      v-if="question.question"
      class="prose prose-sm max-w-none font-medium"
      v-html="question.question"
    />
    <!-- eslint-disable-next-line vue/no-v-html -- backend-authored description -->
    <div
      v-if="question.description"
      class="prose prose-sm max-w-none text-muted"
      v-html="question.description"
    />
  </div>
</template>
