<script setup lang="ts">
import { hasAnswer } from '~/types/homeworkQuestion'

definePageMeta({ layout: 'dashboard', title: 'questions.page_title' })

const route = useRoute()
const store = useHomeworkAttemptStore()
const localePath = useLocalePath()
const { t } = useI18n()

const courseId = computed(() => String(route.params.id))
const homeworkId = computed(() => String(route.params.homeworkID))
const isRetry = computed(() => route.query.retry === 'true')

const confirmFinish = ref(false)

const canSubmit = computed(() => !store.isLoading && hasAnswer(store.answer))

/** Legacy `courseReturnQuery`: return to the tab the student came from. */
const backLink = computed(() => localePath({
  path: `/student/courses/${courseId.value}`,
  query: { tab: route.query.redirectTab ?? 2 }
}))

async function onSubmitAnswer() {
  await store.submitAnswer(homeworkId.value)
}

async function onFinish() {
  if (await store.finish(homeworkId.value)) {
    confirmFinish.value = false
    await navigateTo(backLink.value)
  }
}

onMounted(() => {
  store.reset()
  store.start(homeworkId.value, isRetry.value)
})

onBeforeUnmount(() => store.reset())
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
        {{ t('questions.back_to_course') }}
      </UButton>

      <div class="flex items-center gap-3">
        <span class="text-sm text-muted">
          {{ t('questions.counter', { current: store.currentPage, total: store.totalPages }) }}
        </span>
        <UButton
          color="error"
          variant="soft"
          size="sm"
          @click="confirmFinish = true"
        >
          {{ t('questions.finish') }}
        </UButton>
      </div>
    </div>

    <div class="rounded-xl border border-default bg-default p-5 sm:p-6">
      <div
        v-if="store.isLoading && !store.question"
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
        {{ t('questions.load_failed') }}
      </p>

      <div
        v-else
        class="space-y-6"
      >
        <QuestionsQuestionRenderer
          v-model="store.answer"
          :question="store.question"
          :disabled="store.isLoading"
        />

        <div class="flex flex-wrap items-center justify-between gap-3 border-t border-default pt-4">
          <UButton
            color="neutral"
            variant="outline"
            :disabled="store.currentPage <= 1 || store.isLoading"
            @click="store.goToPage(homeworkId, store.currentPage - 1, isRetry)"
          >
            {{ t('questions.previous') }}
          </UButton>

          <UButton
            :loading="store.isSubmitting"
            :disabled="!canSubmit"
            @click="onSubmitAnswer"
          >
            {{ t('questions.record_answer') }}
          </UButton>

          <UButton
            color="neutral"
            variant="outline"
            :disabled="store.currentPage >= store.totalPages || store.isLoading"
            @click="store.goToPage(homeworkId, store.currentPage + 1, isRetry)"
          >
            {{ t('questions.next') }}
          </UButton>
        </div>
      </div>
    </div>

    <!-- Question navigator -->
    <div
      v-if="store.totalPages > 1"
      class="flex flex-wrap justify-center gap-2"
    >
      <button
        v-for="page in store.totalPages"
        :key="page"
        type="button"
        class="h-9 w-9 rounded-lg border text-sm font-medium transition"
        :class="page === store.currentPage
          ? 'border-primary bg-primary text-inverted'
          : 'border-default hover:bg-elevated'"
        :disabled="store.isLoading"
        @click="store.goToPage(homeworkId, page, isRetry)"
      >
        {{ page }}
      </button>
    </div>

    <UModal
      v-model:open="confirmFinish"
      :title="t('questions.end_test_title')"
    >
      <template #body>
        <p class="text-muted">
          {{ t('questions.sure_finish') }}
        </p>
      </template>
      <template #footer>
        <div class="flex justify-end gap-2">
          <UButton
            color="neutral"
            variant="ghost"
            :disabled="store.isFinishing"
            @click="confirmFinish = false"
          >
            {{ t('questions.no') }}
          </UButton>
          <UButton
            color="error"
            :loading="store.isFinishing"
            @click="onFinish"
          >
            {{ t('questions.yes') }}
          </UButton>
        </div>
      </template>
    </UModal>
  </div>
</template>
