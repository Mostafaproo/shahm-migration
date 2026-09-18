<script setup lang="ts">
definePageMeta({
  layout: 'dashboard',
  title: 'computerized.page_title',
  middleware: 'feature-guard',
  feature: 'computerized_exam'
})

const store = useComputerizedExamStore()
const route = useRoute()
const localePath = useLocalePath()
const { t } = useI18n()

type Filter = 'all' | 'marked' | 'unanswered' | 'quantitative' | 'verbal'
const filter = ref<Filter>('all')

const confirmFinish = ref(false)

const hasSections = computed(() => store.verbalStartIndex > 0)

const FILTERS = computed(() => {
  const items: { value: Filter, label: string }[] = [
    { value: 'all', label: t('computerized.filters.all') },
    { value: 'marked', label: t('computerized.filters.marked') },
    { value: 'unanswered', label: t('computerized.filters.unanswered') }
  ]
  if (hasSections.value) {
    items.push(
      { value: 'quantitative', label: t('computerized.types.quantitative') },
      { value: 'verbal', label: t('computerized.types.verbal') }
    )
  }
  return items
})

/** Keeps the original position so the grid's numbers stay stable when filtered. */
const rows = computed(() =>
  store.questions
    .map((question, index) => ({ question, index }))
    .filter(({ question }) => {
      if (filter.value === 'marked') return question.isMarked
      if (filter.value === 'unanswered') return !question.isAnswered
      if (filter.value === 'quantitative') return question.section === 'quantitative'
      if (filter.value === 'verbal') return question.section === 'verbal'
      return true
    })
)

const unansweredCount = computed(() => store.totalQuestions - store.answeredCount)

function backToQuestion(index: number) {
  store.goTo(index)
  navigateTo(localePath('/student/computerized-test/start-exam'))
}

async function finish() {
  if (await store.end()) {
    const id = store.examId
    store.resetAttempt()
    await navigateTo(localePath({
      path: '/student/computerized-test/result',
      query: { examId: id }
    }))
  }
}

onMounted(() => {
  store.fetchSettings()
  // Reached directly (e.g. a reload) with nothing in memory — there's no exam
  // to map, so send the student back rather than showing an empty grid.
  if (!store.questions.length && !route.query.examId) {
    navigateTo(localePath('/student/computerized-test'))
  }
})
</script>

<template>
  <div class="mx-auto max-w-4xl space-y-5">
    <div class="flex flex-wrap items-center justify-between gap-3">
      <h1 class="text-lg font-bold">
        {{ t('computerized.question_map') }}
      </h1>
      <UButton
        color="error"
        size="lg"
        @click="confirmFinish = true"
      >
        {{ t('computerized.finish') }}
      </UButton>
    </div>

    <!-- eslint-disable-next-line vue/no-v-html -- backend-authored instructions -->
    <div
      v-if="store.settings?.questionMapInstruction"
      class="prose prose-sm max-w-none rounded-xl border border-default bg-default p-5"
      v-html="store.settings.questionMapInstruction"
    />

    <div class="grid grid-cols-2 gap-3 sm:grid-cols-4">
      <div
        v-for="stat in [
          { label: t('computerized.stats.total'), value: store.totalQuestions },
          { label: t('computerized.stats.answered'), value: store.answeredCount },
          { label: t('computerized.stats.unanswered'), value: unansweredCount },
          { label: t('computerized.stats.marked'), value: store.markedCount }
        ]"
        :key="stat.label"
        class="rounded-xl border border-default bg-default p-4 text-center"
      >
        <p class="text-lg font-bold">
          {{ stat.value }}
        </p>
        <p class="text-xs text-muted">
          {{ stat.label }}
        </p>
      </div>
    </div>

    <div class="flex flex-wrap gap-1 rounded-full bg-elevated p-1">
      <button
        v-for="item in FILTERS"
        :key="item.value"
        type="button"
        class="rounded-full px-4 py-1.5 text-sm font-medium transition"
        :class="filter === item.value ? 'bg-default text-default shadow-sm' : 'text-muted hover:text-default'"
        @click="filter = item.value"
      >
        {{ item.label }}
      </button>
    </div>

    <div
      v-if="rows.length"
      class="grid grid-cols-4 gap-3 sm:grid-cols-6 lg:grid-cols-8"
    >
      <button
        v-for="{ question, index } in rows"
        :key="question.id"
        type="button"
        class="relative flex h-12 items-center justify-center rounded-lg border text-sm font-semibold transition"
        :class="question.isAnswered
          ? 'border-primary bg-primary/10 text-primary'
          : 'border-default hover:bg-elevated'"
        @click="backToQuestion(index)"
      >
        {{ index + 1 }}
        <UIcon
          v-if="question.isMarked"
          name="i-lucide-flag"
          class="absolute end-1 top-1 h-3 w-3 text-warning"
        />
      </button>
    </div>

    <p
      v-else
      class="rounded-xl border border-default bg-default py-16 text-center text-muted"
    >
      {{ t('computerized.no_questions') }}
    </p>

    <UModal
      v-model:open="confirmFinish"
      :title="t('computerized.finish')"
    >
      <template #body>
        <p class="text-muted">
          {{ unansweredCount > 0
            ? t('computerized.confirm_finish_unanswered', { count: unansweredCount })
            : t('computerized.confirm_finish') }}
        </p>
      </template>
      <template #footer>
        <div class="flex w-full justify-end gap-2">
          <UButton
            color="neutral"
            variant="ghost"
            :disabled="store.isBusy"
            @click="confirmFinish = false"
          >
            {{ t('computerized.back') }}
          </UButton>
          <UButton
            color="error"
            :loading="store.isBusy"
            @click="finish"
          >
            {{ t('computerized.finish') }}
          </UButton>
        </div>
      </template>
    </UModal>
  </div>
</template>
