<script setup lang="ts">
import { PER_PAGE_OPTIONS } from '~/utils/pagination'

definePageMeta({
  layout: 'dashboard',
  title: 'instructorReports.page_title',
  middleware: 'role-guard',
  roles: ['instructor']
})

const store = useInstructorHomeworkReportsStore()
const coursesStore = useInstructorCoursesStore()
const localePath = useLocalePath()
const { t } = useI18n()

const perPageItems = PER_PAGE_OPTIONS.map(n => ({ label: String(n), value: n }))

const courseItems = computed(() => [
  { label: t('instructorReports.all_courses'), value: null as string | null },
  ...coursesStore.courses.map(c => ({ label: c.name, value: c.id as string | null }))
])

const headings = computed(() => [
  t('instructorReports.exam_title'),
  t('instructorReports.published_at'),
  t('instructorReports.start_date'),
  t('instructorReports.end_date'),
  t('instructorReports.average'),
  t('instructorReports.total_grade'),
  t('instructorReports.actions')
])

onMounted(() => {
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
        :placeholder="t('instructorReports.filter_course')"
        @update:model-value="value => store.setCourse((value as string | null) ?? null)"
      />

      <div class="flex items-center gap-2 text-sm text-muted">
        <span>{{ t('instructorReports.show') }}</span>
        <USelectMenu
          :model-value="store.perPage"
          :items="perPageItems"
          value-key="value"
          class="w-24"
          @update:model-value="value => store.setPerPage(Number(value))"
        />
        <span>{{ t('instructorReports.entries') }}</span>
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
              :to="localePath(`/instructor/homework-reports/${exam.id}`)"
              size="xs"
              variant="soft"
              icon="i-lucide-users"
            >
              {{ t('instructorReports.view_students') }}
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
      {{ t('instructorReports.no_exams') }}
    </p>
  </div>
</template>
