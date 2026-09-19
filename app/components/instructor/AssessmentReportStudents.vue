<script setup lang="ts">
import { assessmentConfig } from '~/types/assessmentKind'
import type { AssessmentKind } from '~/types/assessmentKind'
import { PER_PAGE_OPTIONS } from '~/utils/pagination'

const props = defineProps<{ kind: AssessmentKind }>()

const config = computed(() => assessmentConfig(props.kind))

const exportName = (what: string) =>
  `Course-${props.kind === 'exam' ? 'Exam' : 'Homework'}-Students-${what}-Report.xls`

const store = useInstructorAssessmentReportsStore()
const route = useRoute()
const localePath = useLocalePath()
const { t } = useI18n()

const assessmentId = computed(() => String(route.params.id ?? ''))
const perPageItems = PER_PAGE_OPTIONS.map(n => ({ label: String(n), value: n }))

const headings = computed(() => [
  t('instructorAssessments.student_name'),
  t('instructorAssessments.student_score'),
  t('instructorAssessments.actions')
])

onMounted(() => {
  // The stores are singletons; each screen declares which kind it drives.
  store.kind = props.kind
  store.resetStudents()
  store.fetchStudents(assessmentId.value, 1)
})
</script>

<template>
  <div class="space-y-5">
    <div class="flex flex-wrap items-center justify-between gap-3">
      <UButton
        :to="localePath(config.reportsPath)"
        color="neutral"
        variant="ghost"
        icon="i-lucide-arrow-right"
        class="rtl:[&_span:first-child]:rotate-180"
      >
        {{ t('instructorAssessments.back') }}
      </UButton>

      <div class="flex flex-wrap items-center gap-2">
        <!-- Same two labels and icons as the legacy, and a busy flag each:
             one shared flag spins both buttons for a single export. -->
        <UButton
          color="neutral"
          variant="outline"
          icon="i-lucide-download"
          :loading="store.isExportingScores"
          @click="store.exportScores(assessmentId, exportName('Scores'))"
        >
          {{ t('instructorAssessments.download') }}
        </UButton>
        <UButton
          color="neutral"
          variant="outline"
          icon="i-lucide-file-spreadsheet"
          :loading="store.isExportingGrades"
          @click="store.exportGrades(assessmentId, exportName('Grades'))"
        >
          {{ t('instructorAssessments.export_grades') }}
        </UButton>
      </div>
    </div>

    <div class="flex items-center justify-end gap-2 text-sm text-muted">
      <span>{{ t('instructorAssessments.show') }}</span>
      <USelectMenu
        :model-value="store.studentsPerPage"
        :items="perPageItems"
        value-key="value"
        class="w-24"
        @update:model-value="value => store.setStudentsPerPage(assessmentId, Number(value))"
      />
      <span>{{ t('instructorAssessments.entries') }}</span>
    </div>

    <template v-if="store.isLoadingStudents || store.students.length">
      <SharedDataDisplayAppTable
        :headings="headings"
        :loading="store.isLoadingStudents"
      >
        <tr
          v-for="student in store.students"
          :key="student.id"
          :class="student.attended ? '' : 'opacity-60'"
        >
          <td class="p-4 font-medium">
            {{ student.name }}
          </td>
          <td class="p-4 text-muted">
            {{ student.score || '—' }}
          </td>
          <td class="p-4 text-end">
            <UButton
              v-if="student.attended"
              :to="localePath({
                path: `${config.reportsPath}/${assessmentId}/${student.id}`,
                query: { student_name: student.name }
              })"
              size="xs"
              variant="soft"
              icon="i-lucide-file-search"
            >
              {{ t('instructorAssessments.view_answers') }}
            </UButton>
            <span
              v-else
              class="text-sm text-muted"
            >
              {{ t('instructorAssessments.not_attended') }}
            </span>
          </td>
        </tr>
      </SharedDataDisplayAppTable>

      <SharedDataDisplayAppPagination
        :page="store.studentsPage"
        :total="store.studentsTotal"
        :per-page="store.studentsPerPage"
        :total-pages="store.studentsTotalPages"
        @update:page="p => store.fetchStudents(assessmentId, p)"
      />
    </template>

    <p
      v-else
      class="rounded-xl border border-default bg-default py-16 text-center text-muted"
    >
      {{ t('instructorAssessments.no_students') }}
    </p>
  </div>
</template>
