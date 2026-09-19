<script setup lang="ts">

import { z } from 'zod'

definePageMeta({
  layout: 'dashboard',
  title: 'instructorProjects.evaluation',
  feature: 'learning_path',
  middleware: ['feature-guard', 'role-guard'],
  roles: ['instructor']
})

const store = useInstructorProjectsStore()
const route = useRoute()
const localePath = useLocalePath()
const { t } = useI18n()
const { $appToast: toast } = useNuxtApp()

const pathId = computed(() => String(route.params.pathId ?? ''))
const studentId = computed(() => String(route.params.studentId ?? ''))
const studentName = computed(() => String(route.query.studentName ?? ''))

/** Falls back to the documented path when the query was not carried over. */
const endpointUrl = computed(() => String(route.query.endpoint_url
  ?? `instructor/learning-paths/${pathId.value}/student-final-projects/${studentId.value}`))
const endpointMethod = computed(() => String(route.query.method ?? 'GET'))

const maxGrade = computed(() => Number(store.submission?.finalGrade ?? 0) || 0)

const state = reactive({ grade: '' })

/**
 * Legacy: `required|numeric|min_value:0` plus `max_value:<final_grade>` when
 * the project declares one. vee-validate's `numeric` is digits only — it
 * rejects decimals — so whole marks it is, and that also makes `min_value:0`
 * redundant there.
 */
const schema = computed(() => z.object({
  grade: z.string()
    .min(1, t('instructorProjects.degree_required'))
    .regex(/^\d+$/, t('instructorProjects.degree_numeric'))
    .refine(
      v => !maxGrade.value || Number(v) <= maxGrade.value,
      t('instructorProjects.degree_max', { max: maxGrade.value })
    )
}))

function yesNo(value: boolean): string {
  return value ? t('instructorProjects.yes') : t('instructorProjects.no')
}

async function onSubmit() {
  if (await store.saveGrade(state.grade)) return
  // A failure already toasted through the http client; nothing more to add.
}

async function openSolvedFile() {
  const url = await store.reviewAndOpen(studentId.value)
  if (!url) {
    toast.warning(t('instructorProjects.no_solved_file'))
    return
  }
  window.open(url, '_blank', 'noopener')
}

onMounted(async () => {
  store.resetSubmission()
  await store.fetchSubmission(endpointUrl.value, endpointMethod.value)
  state.grade = store.submission?.grade ?? ''
})
</script>

<template>
  <div class="mx-auto max-w-3xl space-y-5">
    <div class="flex flex-wrap items-center justify-between gap-3">
      <UButton
        :to="localePath(`/instructor/projects/students/${pathId}`)"
        color="neutral"
        variant="ghost"
        icon="i-lucide-arrow-right"
        class="ltr:[&_span:first-child]:rotate-180"
      >
        {{ t('instructorProjects.back') }}
      </UButton>
      <p
        v-if="studentName"
        class="font-medium"
      >
        {{ studentName }}
      </p>
    </div>

    <h1 class="text-xl font-bold">
      {{ t('instructorProjects.evaluation') }}
    </h1>

    <div
      v-if="store.isLoadingSubmission"
      class="space-y-3 rounded-xl border border-default bg-default p-6"
    >
      <USkeleton
        v-for="n in 4"
        :key="n"
        class="h-11 w-full"
      />
    </div>

    <p
      v-else-if="!store.submission"
      class="rounded-xl border border-default bg-default py-16 text-center text-muted"
    >
      {{ t('instructorProjects.no_submission') }}
    </p>

    <template v-else>
      <dl class="grid grid-cols-1 gap-3 rounded-xl border border-default bg-elevated p-5 sm:grid-cols-2">
        <div class="flex items-center justify-between gap-2">
          <dt class="text-sm text-muted">
            {{ t('instructorProjects.watched_files') }}
          </dt>
          <dd>
            <UBadge
              variant="soft"
              :color="store.submission.watchedAllPdfs ? 'success' : 'neutral'"
            >
              {{ yesNo(store.submission.watchedAllPdfs) }}
            </UBadge>
          </dd>
        </div>

        <div class="flex items-center justify-between gap-2">
          <dt class="text-sm text-muted">
            {{ t('instructorProjects.watched_videos') }}
          </dt>
          <dd>
            <UBadge
              variant="soft"
              :color="store.submission.watchedAllVideos ? 'success' : 'neutral'"
            >
              {{ yesNo(store.submission.watchedAllVideos) }}
            </UBadge>
          </dd>
        </div>

        <div
          v-if="store.submission.finalGrade"
          class="flex items-center justify-between gap-2"
        >
          <dt class="text-sm text-muted">
            {{ t('instructorProjects.out_of') }}
          </dt>
          <dd class="font-bold">
            {{ store.submission.finalGrade }}
          </dd>
        </div>
      </dl>

      <div class="flex justify-start">
        <UButton
          color="neutral"
          variant="outline"
          icon="i-lucide-download"
          @click="openSolvedFile"
        >
          {{ t('instructorProjects.open_submission') }}
        </UButton>
      </div>

      <UForm
        :schema="schema"
        :state="state"
        class="space-y-4 rounded-xl border border-default bg-default p-6"
        @submit="onSubmit"
      >
        <UFormField
          :label="t('instructorProjects.student_degree')"
          name="grade"
          required
          :hint="maxGrade ? t('instructorProjects.out_of_max', { max: maxGrade }) : undefined"
        >
          <UInput
            v-model="state.grade"
            type="number"
            min="0"
            step="1"
            :max="maxGrade || undefined"
            class="w-full"
            :placeholder="t('instructorProjects.degree_placeholder')"
            :disabled="!store.submission.canUpdateGrade"
          />
        </UFormField>

        <!-- The backend decides whether this grade is still editable. -->
        <p
          v-if="!store.submission.canUpdateGrade"
          class="text-sm text-muted"
        >
          {{ t('instructorProjects.grade_locked') }}
        </p>

        <div
          v-else
          class="flex justify-end"
        >
          <UButton
            type="submit"
            :loading="store.isSavingGrade"
          >
            {{ t('instructorProjects.save_grade') }}
          </UButton>
        </div>
      </UForm>
    </template>
  </div>
</template>
