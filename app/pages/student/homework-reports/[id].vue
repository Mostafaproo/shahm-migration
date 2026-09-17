<script setup lang="ts">
import { useHomeworkReportsStore } from '~/stores/homeworkReports'

definePageMeta({ layout: 'dashboard', title: 'reports.page_title' })

const route = useRoute()
const store = useHomeworkReportsStore()
const localePath = useLocalePath()
const { t } = useI18n()

const homeworkName = computed(() => String(route.query.homework_name ?? ''))
const backLink = computed(() => localePath('/student/homework-reports'))

const total = computed(() => store.questionLinks.length)
const isLast = computed(() => store.activeIndex >= total.value - 1)

// Review is read-only; the renderer still needs a model, so this is a sink.
const answerSink = ref(null)

function go(index: number) {
  if (index < 0 || index >= total.value || store.isLoadingFeedback) return
  store.fetchQuestion(index)
}

onMounted(() => {
  store.resetFeedback()
  store.fetchFeedback(String(route.params.id))
})

onBeforeUnmount(() => store.resetFeedback())
</script>

<template>
  <div class="mx-auto max-w-4xl space-y-5">
    <div class="flex flex-wrap items-center justify-between gap-3">
      <UButton
        :to="backLink"
        color="neutral"
        variant="ghost"
        size="sm"
        icon="i-lucide-arrow-right"
        class="ltr:[&_span:first-child]:rotate-180"
      >
        {{ t('reports.back') }}
      </UButton>

      <p
        v-if="homeworkName"
        class="font-medium"
      >
        {{ homeworkName }}
      </p>
    </div>

    <div class="rounded-xl border border-default bg-default p-5 sm:p-6">
      <div
        v-if="store.isLoadingFeedback && !store.question"
        class="space-y-3"
      >
        <USkeleton class="h-6 w-2/3" />
        <USkeleton
          v-for="n in 4"
          :key="n"
          class="h-12 w-full"
        />
      </div>

      <p
        v-else-if="!store.question"
        class="py-16 text-center text-muted"
      >
        {{ t('reports.no_answers') }}
      </p>

      <div
        v-else
        class="space-y-6"
      >
        <p class="text-sm text-muted">
          {{ t('questions.counter', { current: store.activeIndex + 1, total }) }}
        </p>

        <QuestionsQuestionRenderer
          v-model="answerSink"
          :question="store.question"
          feedback
        />

        <div class="flex flex-wrap items-center justify-between gap-3 border-t border-default pt-4">
          <UButton
            color="neutral"
            variant="outline"
            :disabled="store.activeIndex <= 0 || store.isLoadingFeedback"
            @click="go(store.activeIndex - 1)"
          >
            {{ t('questions.previous') }}
          </UButton>

          <UButton
            v-if="isLast"
            :to="backLink"
          >
            {{ t('questions.finish') }}
          </UButton>
          <UButton
            v-else
            color="neutral"
            variant="outline"
            :disabled="store.isLoadingFeedback"
            @click="go(store.activeIndex + 1)"
          >
            {{ t('questions.next') }}
          </UButton>
        </div>
      </div>
    </div>

    <!-- Question navigator — green/red shows how each one was graded. -->
    <div
      v-if="total > 1"
      class="flex flex-wrap justify-center gap-2"
    >
      <button
        v-for="(link, index) in store.questionLinks"
        :key="link.id"
        type="button"
        class="h-9 w-9 rounded-lg border text-sm font-medium transition"
        :class="[
          index === store.activeIndex ? 'ring-2 ring-primary' : '',
          link.isCorrect === true ? 'border-success bg-success/10 text-success' : '',
          link.isCorrect === false ? 'border-error bg-error/10 text-error' : '',
          link.isCorrect === null ? 'border-default hover:bg-elevated' : ''
        ]"
        :disabled="store.isLoadingFeedback"
        @click="go(index)"
      >
        {{ index + 1 }}
      </button>
    </div>
  </div>
</template>
