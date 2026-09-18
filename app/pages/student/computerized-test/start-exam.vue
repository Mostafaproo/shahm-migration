<script setup lang="ts">
import { EXAM_TYPES, examTypeKey } from '~/types/computerizedExam'
import type { ExamType } from '~/types/computerizedExam'

definePageMeta({
  layout: 'dashboard',
  title: 'computerized.page_title',
  feature: 'computerized_exam',
  middleware: ['feature-guard', 'role-guard'],
  roles: ['student']
})

const store = useComputerizedExamStore()
const localePath = useLocalePath()
const auth = useAuthStore()
const { t } = useI18n()

type Phase = 'intro' | 'pick-type' | 'questions'
const phase = ref<Phase>('intro')

const route = useRoute()
const reviewMode = computed(() => route.query.reviewMode === 'true')
const reviewExamId = computed(() => String(route.query.examId ?? ''))

const selectedType = ref<ExamType | null>(null)
/** The option highlighted for the current question, before it's committed. */
const picked = ref<number | null>(null)

// --- countdown
const secondsLeft = ref<number | null>(null)
let ticker: ReturnType<typeof setInterval> | null = null

const formattedTime = computed(() => {
  if (secondsLeft.value == null) return ''
  const minutes = Math.floor(secondsLeft.value / 60)
  const seconds = secondsLeft.value % 60
  return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`
})

function stopTimer() {
  if (ticker) clearInterval(ticker)
  ticker = null
}

function startTimer() {
  stopTimer()
  secondsLeft.value = store.remainingSeconds()
  if (secondsLeft.value == null) return
  ticker = setInterval(() => {
    secondsLeft.value = store.remainingSeconds()
    if (secondsLeft.value !== null && secondsLeft.value <= 0) {
      stopTimer()
      goToMap()
    }
  }, 1000)
}

const sectionLabel = computed(() => {
  const section = store.currentQuestion?.section
  return section ? t(`computerized.types.${section}`) : ''
})

function goToMap() {
  navigateTo(localePath({
    path: '/student/computerized-test/guidelines',
    query: { examId: store.examId }
  }))
}

async function beginExam() {
  if (!selectedType.value) return
  if (await store.start(selectedType.value)) {
    picked.value = null
    phase.value = 'questions'
    startTimer()
  }
}

async function commitPick() {
  if (picked.value != null) await store.submitAnswer(picked.value)
}

async function next() {
  await commitPick()
  if (store.currentIndex >= store.totalQuestions - 1) {
    goToMap()
    return
  }
  store.goTo(store.currentIndex + 1)
  picked.value = store.currentQuestion?.selectedOptionId ?? null
}

async function previous() {
  if (!store.canGoBack) return
  await commitPick()
  store.goTo(store.currentIndex - 1)
  picked.value = store.currentQuestion?.selectedOptionId ?? null
}

function reviewPrevious() {
  if (store.currentIndex > 0) store.goTo(store.currentIndex - 1)
}

function reviewNext() {
  if (store.currentIndex >= store.totalQuestions - 1) {
    navigateTo(localePath({
      path: '/student/computerized-test/result',
      query: { id: reviewExamId.value || store.examId }
    }))
    return
  }
  store.goTo(store.currentIndex + 1)
}

onMounted(async () => {
  if (reviewMode.value) {
    // Replaying a finished attempt — skip the intro entirely.
    if (reviewExamId.value && await store.loadReview(reviewExamId.value)) {
      phase.value = 'questions'
    } else {
      navigateTo(localePath('/student/computerized-test'))
    }
    return
  }

  await store.fetchSettings()
  if (store.resume() && !store.questions.length) {
    goToMap()
  }
})

onBeforeUnmount(stopTimer)
</script>

<template>
  <div class="mx-auto max-w-5xl space-y-5">
    <!-- Intro -->
    <div
      v-if="phase === 'intro' && !reviewMode"
      class="space-y-5 rounded-xl border border-default bg-default p-6 text-center"
    >
      <UIcon
        name="i-lucide-clipboard-check"
        class="mx-auto h-16 w-16 text-primary"
      />
      <h1 class="text-xl font-bold">
        {{ t('computerized.welcome', { name: auth.fullName ?? '' }) }}
      </h1>

      <!-- eslint-disable-next-line vue/no-v-html -- backend-authored instructions -->
      <div
        v-if="store.settings?.instructions"
        class="prose prose-sm mx-auto max-w-none text-start"
        v-html="store.settings.instructions"
      />

      <p
        v-if="store.settings?.durationMinutes"
        class="text-sm text-muted"
      >
        {{ t('computerized.duration', { minutes: store.settings.durationMinutes }) }}
      </p>

      <UButton
        size="lg"
        @click="phase = 'pick-type'"
      >
        {{ t('computerized.next') }}
      </UButton>
    </div>

    <!-- Pick a type -->
    <div
      v-else-if="phase === 'pick-type'"
      class="space-y-5 rounded-xl border border-default bg-default p-6"
    >
      <h1 class="text-lg font-bold">
        {{ t('computerized.pick_type') }}
      </h1>

      <div class="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <button
          v-for="type in EXAM_TYPES"
          :key="type"
          type="button"
          class="rounded-xl border p-5 text-center font-medium transition"
          :class="selectedType === type
            ? 'border-primary bg-primary/5 text-primary'
            : 'border-default hover:bg-elevated'"
          @click="selectedType = type"
        >
          {{ t(examTypeKey(type)) }}
        </button>
      </div>

      <div class="flex justify-end gap-2">
        <UButton
          color="neutral"
          variant="ghost"
          @click="phase = 'intro'"
        >
          {{ t('computerized.back') }}
        </UButton>
        <UButton
          size="lg"
          :disabled="!selectedType"
          :loading="store.isBusy"
          @click="beginExam"
        >
          {{ t('computerized.start') }}
        </UButton>
      </div>
    </div>

    <!-- Review of a finished attempt — the legacy's read-only two-panel view -->
    <template v-else-if="reviewMode">
      <div
        v-if="store.currentQuestion"
        class="overflow-hidden rounded-xl border border-default bg-default"
      >
        <!-- Blue title bar, same as the legacy -->
        <div class="flex flex-wrap items-center justify-between gap-3 bg-primary px-5 py-3 text-inverted">
          <span class="font-medium">
            {{ auth.fullName }}<span v-if="sectionLabel"> - {{ sectionLabel }}</span>
          </span>
          <span class="rounded bg-success px-3 py-1 text-sm font-medium">
            {{ t('computerized.review_test') }}
          </span>
        </div>

        <div class="grid grid-cols-1 lg:grid-cols-2">
          <!-- Start side: the question and its options -->
          <div class="space-y-4 border-default p-5 lg:border-e">
            <p
              v-if="store.currentQuestion.title"
              class="font-medium text-primary"
            >
              {{ store.currentQuestion.title }}
            </p>

            <!-- eslint-disable-next-line vue/no-v-html -- backend-authored -->
            <div
              v-if="store.currentQuestion.description"
              class="prose prose-sm max-w-none"
              v-html="store.currentQuestion.description"
            />

            <ul class="space-y-3">
              <li
                v-for="option in store.currentQuestion.options"
                :key="option.id"
                class="flex items-center justify-between gap-3"
              >
                <div class="flex items-center gap-2">
                  <!-- eslint-disable-next-line vue/no-v-html -- backend-authored -->
                  <span v-html="option.text" />

                  <!-- What the student picked, and whether it was right -->
                  <span
                    v-if="option.id === store.currentQuestion.selectedOptionId"
                    class="text-sm"
                    :class="option.isCorrect ? 'text-success' : 'text-error'"
                  >
                    ({{ option.isCorrect ? t('computerized.your_answer_correct') : t('computerized.your_answer_wrong') }})
                  </span>
                  <!-- The model answer, when the student picked something else -->
                  <span
                    v-else-if="option.isCorrect"
                    class="text-sm text-success"
                  >
                    ({{ t('computerized.correct_option') }})
                  </span>
                </div>

                <span
                  class="flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2"
                  :class="option.isCorrect
                    ? 'border-success bg-success text-white'
                    : option.id === store.currentQuestion.selectedOptionId
                      ? 'border-error bg-error text-white'
                      : 'border-default'"
                >
                  <UIcon
                    v-if="option.isCorrect"
                    name="i-lucide-check"
                    class="h-3 w-3"
                  />
                  <UIcon
                    v-else-if="option.id === store.currentQuestion.selectedOptionId"
                    name="i-lucide-x"
                    class="h-3 w-3"
                  />
                </span>
              </li>
            </ul>
          </div>

          <!-- End side: the instruction panel -->
          <!-- eslint-disable-next-line vue/no-v-html -- backend-authored -->
          <div
            class="prose prose-sm max-w-none bg-elevated/40 p-5"
            v-html="store.currentQuestion.instruction"
          />
        </div>

        <!-- Answer explanation -->
        <div
          v-if="store.currentQuestion.correctAnswerDescription"
          class="space-y-2 border-t border-default p-5"
        >
          <p class="flex items-center gap-2 font-medium text-primary">
            <UIcon
              name="i-lucide-info"
              class="h-5 w-5"
            />
            {{ t('computerized.answer_explanation') }}
          </p>
          <!-- eslint-disable-next-line vue/no-v-html -- backend-authored -->
          <div
            class="prose prose-sm max-w-none"
            v-html="store.currentQuestion.correctAnswerDescription"
          />
        </div>

        <!-- Footer nav -->
        <div class="flex items-center justify-between gap-3 bg-primary px-5 py-3">
          <UButton
            color="neutral"
            variant="solid"
            :disabled="store.currentIndex <= 0"
            @click="reviewPrevious"
          >
            {{ t('computerized.previous') }}
          </UButton>
          <!-- Never disabled: on the last question this exits to the result. -->
          <UButton
            color="neutral"
            variant="solid"
            @click="reviewNext"
          >
            {{ t('computerized.next') }}
          </UButton>
        </div>
      </div>

      <div
        v-else
        class="space-y-3"
      >
        <USkeleton class="h-12 w-full" />
        <USkeleton class="h-72 w-full" />
      </div>
    </template>

    <!-- Questions -->
    <template v-else>
      <div class="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-default bg-default p-4">
        <div class="flex items-center gap-3">
          <UBadge
            v-if="sectionLabel"
            color="primary"
            variant="subtle"
          >
            {{ sectionLabel }}
          </UBadge>
          <span class="text-sm text-muted">
            {{ t('computerized.counter', { current: store.currentIndex + 1, total: store.totalQuestions }) }}
          </span>
        </div>

        <div class="flex items-center gap-3">
          <span
            v-if="formattedTime"
            class="flex items-center gap-1.5 rounded-full bg-elevated px-3 py-1.5 text-sm font-semibold"
            dir="ltr"
          >
            <UIcon
              name="i-lucide-timer"
              class="h-4 w-4"
            />
            {{ formattedTime }}
          </span>
          <UButton
            color="error"
            variant="soft"
            size="sm"
            @click="goToMap"
          >
            {{ t('computerized.finish') }}
          </UButton>
        </div>
      </div>

      <div
        v-if="store.currentQuestion"
        class="space-y-5 rounded-xl border border-default bg-default p-6"
      >
        <h2
          v-if="store.currentQuestion.title"
          class="font-bold"
        >
          {{ store.currentQuestion.title }}
        </h2>

        <!-- eslint-disable-next-line vue/no-v-html -- backend-authored question -->
        <div
          v-if="store.currentQuestion.instruction"
          class="prose prose-sm max-w-none"
          v-html="store.currentQuestion.instruction"
        />
        <!-- eslint-disable-next-line vue/no-v-html -- backend-authored question -->
        <div
          v-if="store.currentQuestion.description"
          class="prose prose-sm max-w-none"
          v-html="store.currentQuestion.description"
        />

        <ul class="space-y-2">
          <li
            v-for="option in store.currentQuestion.options"
            :key="option.id"
          >
            <label
              class="flex cursor-pointer items-start gap-3 rounded-lg border p-3 transition"
              :class="picked === option.id
                ? 'border-primary bg-primary/5'
                : 'border-default hover:bg-elevated'"
            >
              <input
                type="radio"
                :name="`q-${store.currentQuestion.id}`"
                :checked="picked === option.id"
                class="mt-1 accent-primary"
                @change="picked = option.id"
              >
              <!-- eslint-disable-next-line vue/no-v-html -- backend-authored option -->
              <div
                class="prose prose-sm max-w-none flex-1"
                v-html="option.text"
              />
            </label>
          </li>
        </ul>

        <div class="flex flex-wrap items-center justify-between gap-3 border-t border-default pt-4">
          <UButton
            color="neutral"
            variant="outline"
            :disabled="!store.canGoBack"
            @click="previous"
          >
            {{ t('computerized.previous') }}
          </UButton>

          <UButton
            :color="store.currentQuestion.isMarked ? 'warning' : 'neutral'"
            variant="soft"
            icon="i-lucide-flag"
            @click="store.toggleMark()"
          >
            {{ store.currentQuestion.isMarked ? t('computerized.unmark') : t('computerized.mark') }}
          </UButton>

          <UButton @click="next">
            {{ store.currentIndex >= store.totalQuestions - 1 ? t('computerized.review') : t('computerized.next') }}
          </UButton>
        </div>
      </div>
    </template>
  </div>
</template>
