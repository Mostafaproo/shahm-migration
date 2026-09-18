<script setup lang="ts">
import { canStartExam } from '~/types/computerizedExam'

definePageMeta({
  layout: 'dashboard',
  title: 'computerized.page_title',
  feature: 'computerized_exam',
  middleware: ['feature-guard', 'role-guard'],
  roles: ['student']
})

const store = useComputerizedExamStore()
const localePath = useLocalePath()
const { t } = useI18n()

const isDesktop = ref(true)

const canStart = computed(() => canStartExam(store.settings))

/** Row numbering continues across pages, like the legacy serial column. */
function serial(index: number): number {
  return (store.page - 1) * 10 + index + 1
}

function checkDevice() {
  const ua = navigator.userAgent.toLowerCase()
  const isMobile = /android|webos|iphone|ipad|ipod|blackberry|iemobile|opera mini/i.test(ua)
  const isTablet = /(ipad|tablet|playbook|silk)|(android(?!.*mobile))/i.test(ua)
  isDesktop.value = window.innerWidth > 1024 && !isMobile && !isTablet
}

onMounted(() => {
  checkDevice()
  window.addEventListener('resize', checkDevice)
  store.fetchSettings()
  store.fetchExams(1)
})

onBeforeUnmount(() => {
  if (import.meta.client) window.removeEventListener('resize', checkDevice)
})
</script>

<template>
  <div class="space-y-5">
    <div class="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-default bg-default p-5">
      <div class="space-y-1">
        <h1 class="text-lg font-bold">
          {{ t('computerized.page_title') }}
        </h1>
        <p
          v-if="store.settings?.durationMinutes"
          class="text-sm text-muted"
        >
          {{ t('computerized.duration', { minutes: store.settings.durationMinutes }) }}
        </p>
      </div>

      <UButton
        v-if="isDesktop"
        :to="canStart ? localePath('/student/computerized-test/start-exam') : undefined"
        :disabled="!canStart"
        size="lg"
        @click="canStart && store.resetAttempt()"
      >
        {{ t('computerized.start_new') }}
      </UButton>
    </div>

    <UAlert
      v-if="!isDesktop"
      color="warning"
      variant="subtle"
      icon="i-lucide-monitor"
      :description="t('computerized.desktop_only')"
    />

    <!-- eslint-disable-next-line vue/no-v-html -- backend-authored instructions -->
    <div
      v-if="store.settings?.instructions"
      class="prose prose-sm max-w-none rounded-xl border border-default bg-default p-5"
      v-html="store.settings.instructions"
    />

    <h2 class="text-lg font-bold">
      {{ t('computerized.previous_attempts') }}
    </h2>

    <div
      v-if="store.isLoadingList && !store.exams.length"
      class="space-y-2"
    >
      <USkeleton
        v-for="n in 5"
        :key="n"
        class="h-12 w-full"
      />
    </div>

    <template v-else-if="store.exams.length">
      <SharedDataDisplayAppTable
        :headings="[
          t('computerized.serial'),
          t('computerized.date'),
          t('computerized.verbal_score'),
          t('computerized.quantitative_score'),
          t('computerized.total_score'),
          t('computerized.time_spent_minutes'),
          t('computerized.actions')
        ]"
      >
        <tr
          v-for="(exam, index) in store.exams"
          :key="exam.id"
        >
          <td class="p-4">
            {{ serial(index) }}
          </td>
          <td class="p-4 text-muted">
            {{ exam.date || '-' }}
          </td>
          <td class="p-4">
            {{ exam.verbalScore }}
          </td>
          <td class="p-4">
            {{ exam.quantitativeScore }}
          </td>
          <td class="p-4 font-bold">
            {{ exam.overallScore }}
          </td>
          <td class="p-4">
            {{ exam.timeSpentMinutes }}
          </td>
          <td class="p-4">
            <UButton
              size="xs"
              :to="localePath({
                path: '/student/computerized-test/result',
                query: { id: exam.id }
              })"
            >
              {{ t('computerized.view_details') }}
            </UButton>
          </td>
        </tr>
      </SharedDataDisplayAppTable>

      <SharedDataDisplayAppPagination
        :page="store.page"
        :total="store.total"
        :per-page="10"
        :total-pages="store.totalPages"
        @update:page="store.fetchExams"
      />
    </template>

    <p
      v-else
      class="rounded-xl border border-default bg-default py-16 text-center text-muted"
    >
      {{ t('computerized.no_attempts') }}
    </p>
  </div>
</template>
