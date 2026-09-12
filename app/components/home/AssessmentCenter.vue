<script setup lang="ts">
// Landing page's assessment-center section — ported from shaham-go-fe's
// pages/index.vue. Same two gates as the legacy: the tenant's
// `computerized_exam` feature flag AND `is_feature_available` on
// `GET computerized-exam/settings` (confirmed live — the settings document
// is a collection, hence the `data[0]`).
// The exam preview on the side is an illustration, but its duration and
// question count come from those real settings so it can't contradict the
// actual product.
import { resolveRolePath } from '~/core/auth'

interface RawExamSettings {
  is_feature_available?: boolean
  exam_duration_seconds?: number
  question_count?: number
}

const http = useHttp()
const tenant = useTenant()
const auth = useAuthStore()
const localePath = useLocalePath()
const { locale, t } = useI18n()

const isEnabled = computed(() => tenant.features.computerized_exam !== false)

const { data: settings } = await useAsyncData('exam-settings', async () => {
  if (!isEnabled.value) return null
  const res = await http.get<{ data?: { data?: RawExamSettings[] } }>(
    `${locale.value}/computerized-exam/settings`
  )
  return res?.data?.data?.[0] ?? null
})

const isVisible = computed(() => isEnabled.value && settings.value?.is_feature_available === true)

const totalQuestions = computed(() => settings.value?.question_count || 20)
/** Illustrative mid-exam position, kept at ~¾ so the progress bar reads well. */
const currentQuestion = computed(() => Math.max(1, Math.round(totalQuestions.value * 0.75)))
const progressPercent = computed(() => (currentQuestion.value / totalQuestions.value) * 100)

const duration = computed(() => {
  const seconds = settings.value?.exam_duration_seconds || 2700
  const minutes = Math.floor(seconds / 60)
  return `${String(minutes).padStart(2, '0')}:${String(seconds % 60).padStart(2, '0')}`
})

const FEATURES = [
  { icon: 'i-lucide-clock', title: 'home.assessment.feature_timing_title', text: 'home.assessment.feature_timing_text' },
  { icon: 'i-lucide-target', title: 'home.assessment.feature_questions_title', text: 'home.assessment.feature_questions_text' },
  { icon: 'i-lucide-bar-chart-3', title: 'home.assessment.feature_analysis_title', text: 'home.assessment.feature_analysis_text' }
]

const PREVIEW_OPTIONS = ['5', '6', '7', '8']
const SELECTED_OPTION = '7'

function onStart() {
  // Ported from the legacy `startNow()`: each role has its own test page,
  // and guests go to login carrying the intent so it can resume after
  // signing in.
  const path = resolveRolePath(auth.userType, {
    student: '/student/computerized-test',
    instructor: '/instructor/computerized-test'
  })

  if (path) return navigateTo(localePath(path))

  return navigateTo(localePath({
    path: '/auth/login',
    query: { redirect_computerized_test: '/student/computerized-test' }
  }))
}
</script>

<template>
  <div
    v-if="isVisible"
    class="bg-elevated/40 py-14"
  >
    <UContainer class="grid grid-cols-1 items-center gap-10 lg:grid-cols-2">
      <div class="space-y-5">
        <UBadge
          variant="subtle"
          size="sm"
        >
          {{ t('home.assessment.badge') }}
        </UBadge>

        <h2 class="text-3xl font-bold leading-snug">
          {{ t('home.assessment.title') }}
          <span class="block text-primary">{{ t('home.assessment.title_highlight') }}</span>
        </h2>

        <p class="text-muted">
          {{ t('home.assessment.description') }}
        </p>

        <div class="grid grid-cols-1 gap-3 sm:grid-cols-3">
          <div
            v-for="feature in FEATURES"
            :key="feature.title"
            class="space-y-1 rounded-xl bg-default/70 p-4 text-center"
          >
            <UIcon
              :name="feature.icon"
              class="h-6 w-6 text-primary"
            />
            <p class="text-sm font-semibold">
              {{ t(feature.title) }}
            </p>
            <p class="text-xs text-muted">
              {{ t(feature.text) }}
            </p>
          </div>
        </div>

        <UButton
          size="lg"
          trailing-icon="i-lucide-arrow-left"
          @click="onStart"
        >
          {{ t('home.assessment.start_now') }}
        </UButton>
      </div>

      <div class="rounded-2xl bg-default p-5 shadow-lg">
        <div class="space-y-3 rounded-xl bg-elevated/60 p-4">
          <div class="flex items-center justify-between">
            <span class="flex items-center gap-1.5 text-sm font-medium">
              <UIcon
                name="i-lucide-clock"
                class="h-4 w-4"
              />
              {{ duration }}
            </span>
            <span class="rounded-full bg-default px-3 py-1 text-xs font-medium shadow-sm">
              {{ t('home.assessment.preview_label') }}
            </span>
          </div>

          <UProgress :model-value="progressPercent" />

          <p class="text-xs text-muted">
            {{ t('home.assessment.preview_progress', { current: currentQuestion, total: totalQuestions }) }}
          </p>
        </div>

        <div class="mt-5 space-y-3">
          <p class="font-semibold">
            {{ t('home.assessment.preview_question') }}
          </p>

          <div
            v-for="option in PREVIEW_OPTIONS"
            :key="option"
            class="rounded-lg border px-4 py-3 text-sm"
            :class="option === SELECTED_OPTION
              ? 'border-primary bg-primary/5 font-medium'
              : 'border-default'"
          >
            {{ option }}
          </div>
        </div>
      </div>
    </UContainer>
  </div>
</template>
