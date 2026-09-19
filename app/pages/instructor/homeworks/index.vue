<script setup lang="ts">
import { PER_PAGE_OPTIONS } from '~/utils/pagination'
import type { InstructorHomework } from '~/types/instructorHomework'

definePageMeta({
  layout: 'dashboard',
  title: 'instructorHomeworks.page_title',
  middleware: 'role-guard',
  roles: ['instructor']
})

const store = useInstructorHomeworksStore()
const coursesStore = useInstructorCoursesStore()
const localePath = useLocalePath()
const { t } = useI18n()

const perPageItems = PER_PAGE_OPTIONS.map(n => ({ label: String(n), value: n }))

const courseItems = computed(() => [
  { label: t('instructorHomeworks.all_courses'), value: null as string | null },
  ...coursesStore.courses.map(c => ({ label: c.name, value: c.id as string | null }))
])

const headings = computed(() => [
  t('instructorHomeworks.exam_title'),
  t('instructorHomeworks.published_at'),
  t('instructorHomeworks.start_date'),
  t('instructorHomeworks.end_date'),
  t('instructorHomeworks.actions')
])

function can(row: InstructorHomework, key: string): boolean {
  return row.actions.some(a => a.key === key)
}

// --- confirm before publishing or deleting, as the legacy popconfirm does
type Pending = { row: InstructorHomework, kind: 'publish' | 'unpublish' | 'delete' }
const pending = ref<Pending | null>(null)

const confirmText = computed(() => {
  if (!pending.value) return ''
  return t(`instructorHomeworks.confirm.${pending.value.kind}`)
})

async function confirmAction() {
  const job = pending.value
  if (!job) return
  pending.value = null

  const ok = job.kind === 'delete'
    ? await store.remove(job.row.id)
    : await store.publish(job.row.id)

  if (ok) await store.fetchList(store.page)
}

const route = useRoute()

onMounted(() => {
  // Publishing from the builder sends you here with `?course_id=`. The legacy
  // set that query too but never read it, so the filter came back empty.
  const fromQuery = route.query.course_id
  store.courseId = fromQuery ? String(fromQuery) : null

  store.fetchList(1)
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
        :placeholder="t('instructorHomeworks.filter_course')"
        @update:model-value="value => store.setCourse((value as string | null) ?? null)"
      />

      <div class="flex flex-wrap items-center gap-3">
        <div class="flex items-center gap-2 text-sm text-muted">
          <span>{{ t('instructorHomeworks.show') }}</span>
          <USelectMenu
            :model-value="store.perPage"
            :items="perPageItems"
            value-key="value"
            class="w-24"
            @update:model-value="value => store.setPerPage(Number(value))"
          />
          <span>{{ t('instructorHomeworks.entries') }}</span>
        </div>

        <UButton
          :to="localePath('/instructor/homeworks/create')"
          icon="i-lucide-plus"
        >
          {{ t('instructorHomeworks.create_title') }}
        </UButton>
      </div>
    </div>

    <template v-if="store.isLoading || store.items.length">
      <SharedDataDisplayAppTable
        :headings="headings"
        :loading="store.isLoading"
      >
        <tr
          v-for="row in store.items"
          :key="row.id"
        >
          <td class="p-4 font-medium">
            {{ row.title }}
          </td>
          <td class="p-4 text-muted">
            {{ row.publishedAt || '—' }}
          </td>
          <td class="p-4 text-muted">
            {{ row.startAt || '—' }}
          </td>
          <td class="p-4 text-muted">
            {{ row.endAt || '—' }}
          </td>
          <td class="p-4">
            <div class="flex flex-wrap items-center gap-1">
              <UButton
                v-if="can(row, 'publish_homework')"
                size="xs"
                variant="soft"
                color="info"
                icon="i-lucide-send"
                :loading="store.isBusy(`publish:${row.id}`)"
                @click="pending = { row, kind: 'publish' }"
              >
                {{ t('instructorHomeworks.publish') }}
              </UButton>

              <UButton
                v-if="can(row, 'un_publish_homework')"
                size="xs"
                variant="soft"
                color="warning"
                icon="i-lucide-undo-2"
                :loading="store.isBusy(`publish:${row.id}`)"
                @click="pending = { row, kind: 'unpublish' }"
              >
                {{ t('instructorHomeworks.unpublish') }}
              </UButton>

              <UButton
                v-if="can(row, 'edit_homework')"
                :to="localePath(`/instructor/homeworks/${row.courseId}/${row.id}`)"
                size="xs"
                variant="soft"
                icon="i-lucide-pencil"
              >
                {{ t('instructorHomeworks.edit') }}
              </UButton>

              <UButton
                v-if="can(row, 'delete_homework')"
                size="xs"
                variant="soft"
                color="error"
                icon="i-lucide-trash-2"
                :loading="store.isBusy(`delete:${row.id}`)"
                @click="pending = { row, kind: 'delete' }"
              >
                {{ t('instructorHomeworks.delete') }}
              </UButton>
            </div>
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
      {{ store.courseId
        ? t('instructorHomeworks.no_exams_in_course')
        : t('instructorHomeworks.no_exams') }}
    </p>

    <UModal
      :open="Boolean(pending)"
      :title="confirmText"
      @update:open="value => { if (!value) pending = null }"
    >
      <template #footer>
        <div class="flex w-full justify-end gap-2">
          <UButton
            color="neutral"
            variant="ghost"
            @click="pending = null"
          >
            {{ t('instructorHomeworks.no') }}
          </UButton>
          <UButton
            :color="pending?.kind === 'delete' ? 'error' : 'primary'"
            @click="confirmAction"
          >
            {{ t('instructorHomeworks.yes') }}
          </UButton>
        </div>
      </template>
    </UModal>
  </div>
</template>
