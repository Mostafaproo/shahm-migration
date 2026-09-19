<script setup lang="ts">
import { PER_PAGE_OPTIONS } from '~/utils/pagination'

definePageMeta({
  layout: 'dashboard',
  title: 'instructorProjects.path_students',
  feature: 'learning_path',
  middleware: ['feature-guard', 'role-guard'],
  roles: ['instructor']
})

const store = useInstructorProjectsStore()
const route = useRoute()
const localePath = useLocalePath()
const { t } = useI18n()

const pathId = computed(() => String(route.params.pathId ?? ''))
const perPageItems = PER_PAGE_OPTIONS.map(n => ({ label: String(n), value: n }))

const headings = computed(() => [
  t('instructorProjects.student_name'),
  t('instructorProjects.email'),
  t('instructorProjects.mobile'),
  t('instructorProjects.registration_date'),
  t('instructorProjects.actions')
])

onMounted(() => {
  store.resetStudents()
  store.fetchStudents(pathId.value, 1)
})
</script>

<template>
  <div class="space-y-5">
    <div class="flex flex-wrap items-center justify-between gap-3">
      <UButton
        :to="localePath('/instructor/projects')"
        color="neutral"
        variant="ghost"
        icon="i-lucide-arrow-right"
        class="ltr:[&_span:first-child]:rotate-180"
      >
        {{ t('instructorProjects.back') }}
      </UButton>

      <div class="flex items-center gap-2 text-sm text-muted">
        <span>{{ t('instructorProjects.show') }}</span>
        <USelectMenu
          :model-value="store.studentsPerPage"
          :items="perPageItems"
          value-key="value"
          class="w-24"
          @update:model-value="value => store.setStudentsPerPage(pathId, Number(value))"
        />
        <span>{{ t('instructorProjects.entries') }}</span>
      </div>
    </div>

    <template v-if="store.isLoadingStudents || store.students.length">
      <SharedDataDisplayAppTable
        :headings="headings"
        :loading="store.isLoadingStudents"
      >
        <tr
          v-for="student in store.students"
          :key="student.id"
          :class="student.hasSubmission ? '' : 'opacity-60'"
        >
          <td class="p-4 font-medium">
            {{ student.name }}
          </td>
          <td class="p-4 text-muted">
            {{ student.email || '—' }}
          </td>
          <td class="p-4 text-muted">
            {{ student.mobile || '—' }}
          </td>
          <td class="p-4 text-muted">
            {{ student.registeredAt || '—' }}
          </td>
          <td class="p-4">
            <UButton
              v-if="student.hasSubmission"
              :to="localePath({
                path: `/instructor/projects/students/${pathId}/${student.id}`,
                query: { studentName: student.name }
              })"
              size="xs"
              variant="soft"
              icon="i-lucide-file-search"
            >
              {{ t('instructorProjects.view_project') }}
            </UButton>
            <!-- The legacy shows this instead of a link when nothing was
                 submitted; there is no action to offer. -->
            <span
              v-else
              class="text-sm text-muted"
            >
              {{ t('instructorProjects.no_submission') }}
            </span>
          </td>
        </tr>
      </SharedDataDisplayAppTable>

      <SharedDataDisplayAppPagination
        :page="store.studentsPage"
        :total="store.studentsTotal"
        :per-page="store.studentsPerPage"
        :total-pages="store.studentsTotalPages"
        @update:page="p => store.fetchStudents(pathId, p)"
      />
    </template>

    <p
      v-else
      class="rounded-xl border border-default bg-default py-16 text-center text-muted"
    >
      {{ t('instructorProjects.no_students') }}
    </p>
  </div>
</template>
