<script setup lang="ts">
// Ported 1:1 from the legacy `components/TestResultCard.vue`: a progress ring
// showing degree/total, the student's name and section label, the date, and
// three stat boxes (correct / wrong / marked for review).
import type { SectionBreakdown } from '~/types/computerizedExam'

const props = defineProps<{
  section: 'quantitative' | 'verbal'
  sectionLabel: string
  userName: string
  date: string
  /** Section score out of its question count. */
  degree: number
  questionCount: number
  /** Per-section tallies for the three stat boxes. */
  breakdown: SectionBreakdown
}>()

const RADIUS = 45
const CIRCUMFERENCE = 2 * Math.PI * RADIUS

/** Legacy `scorePercentage` — degree over the section's question count. */
const ratio = computed(() => {
  if (!props.questionCount) return 0
  return Math.min(1, Math.max(0, props.degree / props.questionCount))
})

const dashArray = computed(() => `${ratio.value * CIRCUMFERENCE} ${CIRCUMFERENCE}`)

/**
 * Legacy `wrongAnswersCount`: for a typed section it's the questions the
 * student did NOT get right, not just the ones answered wrong — unanswered
 * questions count against them too.
 */
const wrongCount = computed(() =>
  props.questionCount ? props.questionCount - props.degree : props.breakdown.wrong
)

const STATS = computed(() => [
  {
    key: 'correct',
    label: 'computerized.correct_answers',
    value: props.breakdown.correct,
    unit: 'computerized.question_singular',
    icon: 'i-lucide-check',
    tone: 'bg-success/10 text-success'
  },
  {
    key: 'wrong',
    label: 'computerized.wrong_answers',
    value: wrongCount.value,
    unit: 'computerized.questions_plural',
    icon: 'i-lucide-x',
    tone: 'bg-error/10 text-error'
  },
  {
    key: 'marked',
    label: 'computerized.marked_for_review',
    value: props.breakdown.marked,
    unit: 'computerized.question_singular',
    icon: 'i-lucide-flag',
    tone: 'bg-warning/10 text-warning'
  }
])
</script>

<template>
  <div class="overflow-hidden rounded-xl bg-default">
    <!-- Header: ring + identity on the start side, date on the end side -->
    <div class="flex flex-wrap items-center justify-between gap-4 border-b border-default p-5">
      <div class="flex items-center gap-4">
        <div class="relative h-[100px] w-[100px] shrink-0">
          <svg
            viewBox="0 0 100 100"
            class="h-full w-full -rotate-90"
          >
            <circle
              cx="50"
              cy="50"
              :r="RADIUS"
              fill="none"
              stroke="currentColor"
              class="text-elevated"
              stroke-width="8"
            />
            <circle
              cx="50"
              cy="50"
              :r="RADIUS"
              fill="none"
              stroke="currentColor"
              class="text-primary"
              stroke-width="8"
              stroke-linecap="round"
              :stroke-dasharray="dashArray"
            />
          </svg>
          <div
            class="absolute inset-0 flex items-center justify-center text-lg font-bold text-primary"
            dir="ltr"
          >
            {{ degree }} / {{ questionCount }}
          </div>
        </div>

        <div class="space-y-1">
          <p class="text-sm text-muted">
            {{ userName }}
          </p>
          <p class="font-bold text-primary">
            {{ sectionLabel }}
          </p>
        </div>
      </div>

      <span class="text-sm text-muted">{{ date }}</span>
    </div>

    <!-- Stat boxes -->
    <div class="grid grid-cols-1 gap-4 p-5 sm:grid-cols-3">
      <div
        v-for="stat in STATS"
        :key="stat.key"
        class="flex items-center justify-between gap-3 rounded-lg border border-default p-4"
      >
        <div class="space-y-0.5 text-end">
          <p class="text-xs text-muted">
            {{ $t(stat.label) }}
          </p>
          <p class="font-bold">
            {{ stat.value }} {{ $t(stat.unit) }}
          </p>
        </div>
        <span
          class="flex h-10 w-10 shrink-0 items-center justify-center rounded-full"
          :class="stat.tone"
        >
          <UIcon
            :name="stat.icon"
            class="h-5 w-5"
          />
        </span>
      </div>
    </div>
  </div>
</template>
