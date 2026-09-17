<script setup lang="ts">
import { assessmentTypeKey } from '~/types/homeworkReport'
import { PER_PAGE_OPTIONS } from '~/utils/pagination'
import { useHomeworkReportsStore } from '~/stores/homeworkReports'

definePageMeta({ layout: 'dashboard', title: 'reports.page_title' })

const store = useHomeworkReportsStore()
const localePath = useLocalePath()
const { t } = useI18n()

const perPageItems = PER_PAGE_OPTIONS.map(n => ({ label: String(n), value: n }))

const courseItems = computed(() => [
  { label: t('reports.all_courses'), value: null as string | null },
  ...store.courseOptions.map(c => ({ label: c.title, value: c.id as string | null }))
])

/** Localize the assessment type, falling back to the raw value like the legacy. */
function typeLabel(raw: string): string {
  const key = assessmentTypeKey(raw)
  return key ? t(key) : raw
}

onMounted(() => store.fetchList(1))
</script>

<template>
  <div class="space-y-5">
    <div class="flex flex-wrap items-center justify-between gap-3">
      <USelectMenu
        :model-value="store.courseId"
        :items="courseItems"
        value-key="value"
        class="w-full sm:w-72"
        :placeholder="t('reports.filter_course')"
        @update:model-value="value => store.setCourse((value as string | null) ?? null)"
      />

      <div class="flex items-center gap-2 text-sm text-muted">
        <span>{{ t('reports.show') }}</span>
        <USelectMenu
          :model-value="store.perPage"
          :items="perPageItems"
          value-key="value"
          class="w-24"
          @update:model-value="value => store.setPerPage(Number(value))"
        />
        <span>{{ t('reports.entries') }}</span>
      </div>
    </div>

    <div
      v-if="store.isLoading && !store.items.length"
      class="space-y-2"
    >
      <USkeleton
        v-for="n in 8"
        :key="n"
        class="h-12 w-full"
      />
    </div>

    <template v-else-if="store.items.length">
      <div class="overflow-x-auto rounded-xl border border-default bg-default">
        <table class="w-full text-sm">
          <thead class="border-b border-default text-muted">
            <tr>
              <th class="p-4 text-start font-medium">
                {{ t('reports.title') }}
              </th>
              <th class="p-4 text-start font-medium">
                {{ t('reports.assessment_type') }}
              </th>
              <th class="p-4 text-start font-medium">
                {{ t('reports.start_date') }}
              </th>
              <th class="p-4 text-start font-medium">
                {{ t('reports.end_date') }}
              </th>
              <th class="p-4 text-start font-medium">
                {{ t('reports.grade') }}
              </th>
              <th class="p-4 text-start font-medium">
                {{ t('reports.actions') }}
              </th>
            </tr>
          </thead>
          <tbody class="divide-y divide-default">
            <tr
              v-for="row in store.items"
              :key="row.id"
            >
              <td class="p-4 font-medium">
                {{ row.title }}
              </td>
              <td class="p-4 text-muted">
                {{ typeLabel(row.assessmentType) || '—' }}
              </td>
              <td class="p-4 text-muted">
                {{ row.startAt || '—' }}
              </td>
              <td class="p-4 text-muted">
                {{ row.endAt || '—' }}
              </td>
              <td class="p-4">
                {{ row.score || '—' }}
              </td>
              <td class="p-4">
                <UButton
                  v-if="row.hasAnswers"
                  size="xs"
                  variant="soft"
                  :to="localePath({
                    path: `/student/homework-reports/${row.id}`,
                    query: { homework_name: row.title }
                  })"
                >
                  {{ t('reports.view_answers') }}
                </UButton>
                <span
                  v-else
                  class="text-muted"
                >{{ t('reports.not_attended') }}</span>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

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
      {{ t('reports.no_reports') }}
    </p>
  </div>
</template>
