<script setup lang="ts">
definePageMeta({
  layout: 'dashboard',
  title: 'computerized.result_title',
  feature: 'computerized_exam',
  middleware: ['feature-guard', 'role-guard'],
  roles: ['student']
})

const route = useRoute()
const store = useComputerizedExamStore()
const auth = useAuthStore()
const localePath = useLocalePath()
const { t } = useI18n()

const examId = computed(() => String(route.query.id ?? ''))
const result = computed(() => store.result)

/**
 * Legacy renders one card for a single-section exam and two for a combined
 * one, feeding each the section's own degree and question count.
 */
const cards = computed(() => {
  const r = result.value
  if (!r) return []

  const quantitative = {
    section: 'quantitative' as const,
    sectionLabel: t('computerized.types.quantitative'),
    degree: r.quantitativeDegree,
    questionCount: r.quantitativeQuestionCount,
    breakdown: r.quantitative
  }
  const verbal = {
    section: 'verbal' as const,
    sectionLabel: t('computerized.types.verbal'),
    degree: r.verbalDegree,
    questionCount: r.verbalQuestionCount,
    breakdown: r.verbal
  }

  if (r.type === 'quantitative') return [quantitative]
  if (r.type === 'verbal') return [verbal]
  if (r.type === 'quantitative_and_verbal') return [quantitative, verbal]
  return []
})

function reviewExam() {
  const id = examId.value || result.value?.id
  if (!id) return
  navigateTo(localePath({
    path: '/student/computerized-test/start-exam',
    query: { reviewMode: 'true', examId: id }
  }))
}

onMounted(() => {
  if (!examId.value) {
    navigateTo(localePath('/student/computerized-test'))
    return
  }
  store.fetchResult(examId.value)
})
</script>

<template>
  <div class="space-y-5">
    <!-- Header -->
    <div class="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-default bg-default p-5">
      <h1 class="text-lg font-bold">
        {{ t('computerized.result_title') }}
      </h1>

      <div
        v-if="result"
        class="flex flex-wrap items-center gap-2"
      >
        <span class="rounded-lg bg-primary/10 px-3 py-2 text-sm font-medium text-primary">
          {{ t('computerized.time_spent_minutes') }}: {{ result.time }}
        </span>
        <span class="flex items-center gap-2 rounded-lg bg-primary/10 px-3 py-2 text-sm text-primary">
          <span>{{ t('computerized.total_test_result') }}</span>
          <span
            class="font-bold"
            dir="ltr"
          >{{ result.totalCount }}-{{ result.degree }}</span>
        </span>
      </div>
    </div>

    <div
      v-if="store.isLoadingResult && !result"
      class="space-y-4"
    >
      <USkeleton class="mx-auto h-12 w-48 rounded-lg" />
      <USkeleton class="h-56 w-full rounded-xl" />
    </div>

    <p
      v-else-if="!result"
      class="py-16 text-center text-muted"
    >
      {{ t('computerized.no_result') }}
    </p>

    <template v-else>
      <div class="flex justify-center">
        <UButton
          size="lg"
          icon="i-lucide-clipboard-check"
          @click="reviewExam"
        >
          {{ t('computerized.review_test') }}
        </UButton>
      </div>

      <div class="space-y-5">
        <ComputerizedTestResultCard
          v-for="card in cards"
          :key="card.section"
          :section="card.section"
          :section-label="card.sectionLabel"
          :user-name="auth.fullName ?? ''"
          :date="result.createdAt"
          :degree="card.degree"
          :question-count="card.questionCount"
          :breakdown="card.breakdown"
        />
      </div>
    </template>
  </div>
</template>
