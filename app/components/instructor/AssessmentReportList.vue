<script setup lang="ts">
import { assessmentConfig, kindKey } from '~/types/assessmentKind'
import type { AssessmentKind } from '~/types/assessmentKind'
import { PER_PAGE_OPTIONS } from '~/utils/pagination'

const props = defineProps<{ kind: AssessmentKind }>()

const config = computed(() => assessmentConfig(props.kind))

const store = useInstructorAssessmentReportsStore()
const coursesStore = useInstructorCoursesStore()
const localePath = useLocalePath()
const { t } = useI18n()

const perPageItems = PER_PAGE_OPTIONS.map(n => ({ label: String(n), value: n }))

const courseItems = computed(() => [
  { label: t('instructorAssessments.all_courses'), value: null as string | null },
  ...coursesStore.courses.map(c => ({ label: c.name, value: c.id as string | null }))
])

const headings = computed(() => [
  t(kindKey(props.kind, 'title_label')),
  t('instructorAssessments.published_at'),
  t('instructorAssessments.start_date'),
  t('instructorAssessments.end_date'),
  t('instructorAssessments.average'),
  t('instructorAssessments.total_grade'),
  t('instructorAssessments.actions')
])

onMounted(() => {
  // The stores are singletons; each screen declares which kind it drives.
  store.kind = props.kind
  store.fetchExams(1)
  // Only page one, like the legacy — an instructor with more courses than one
  // page cannot filter by the rest. Skipped when the courses page already
  // loaded them, so its infinite scroll is not reset out from under it.
  if (!coursesStore.courses.length) coursesStore.fetchCourses()
})
</script>

<template>
  <div class="space-y-5">
    <div class="flex flex-wrap items-center justify-between gap-3">
      <USelectMenu
        :model-value="store.courseId"
        :items="courseItems"
        value-key="value"
        class="w-full sm:w-72"
        :placeholder="t('instructorAssessments.filter_course')"
        @update:model-value="value => store.setCourse((value as string | null) ?? null)"
      />

      <div class="flex items-center gap-2 text-sm text-muted">
        <span>{{ t('instructorAssessments.show') }}</span>
        <USelectMenu
          :model-value="store.perPage"
          :items="perPageItems"
          value-key="value"
          class="w-24"
          @update:model-value="value => store.setPerPage(Number(value))"
        />
        <span>{{ t('instructorAssessments.entries') }}</span>
      </div>
    </div>

    <template v-if="store.isLoading || store.exams.length">
      <SharedDataDisplayAppTable
        :headings="headings"
        :loading="store.isLoading"
      >
        <tr
          v-for="exam in store.exams"
          :key="exam.id"
        >
          <td class="p-4 font-medium">
            {{ exam.title }}
          </td>
          <td class="p-4 text-muted">
            {{ exam.publishedAt || '—' }}
          </td>
          <td class="p-4 text-muted">
            {{ exam.startAt || '—' }}
          </td>
          <td class="p-4 text-muted">
            {{ exam.endAt || '—' }}
          </td>
          <td class="p-4 text-muted">
            {{ exam.average || '—' }}
          </td>
          <td class="p-4 text-muted">
            {{ exam.mark || '—' }}
          </td>
          <td class="p-4 text-end">
            <UButton
              :to="localePath(`${config.reportsPath}/${exam.id}`)"
              size="xs"
              variant="soft"
              icon="i-lucide-users"
            >
              {{ t('instructorAssessments.view_students') }}
            </UButton>
          </td>
        </tr>
      </SharedDataDisplayAppTable>

      <SharedDataDisplayAppPagination
        :page="store.page"
        :total="store.total"
        :per-page="store.perPage"
        :total-pages="store.totalPages"
        @update:page="store.setPage"
      />
    </template>

    <p
      v-else
      class="rounded-xl border border-default bg-default py-16 text-center text-muted"
    >
      {{ t(kindKey(kind, 'no_reports')) }}
    </p>
  </div>
</template>
