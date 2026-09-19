<script setup lang="ts">
import type { ProjectMedia } from '~/types/instructorProject'

definePageMeta({
  layout: 'dashboard',
  title: 'instructorProjects.view_project',
  feature: 'learning_path',
  middleware: ['feature-guard', 'role-guard'],
  roles: ['instructor']
})

const store = useInstructorProjectsStore()
const route = useRoute()
const router = useRouter()
const localePath = useLocalePath()
const { t } = useI18n()

const pathId = computed(() => String(route.query.pathId ?? ''))
const pathName = computed(() => String(route.query.pathName ?? ''))

type Tab = 'readable' | 'visual' | 'requirements'

/** The legacy keeps the tab in the URL, so a reload lands where you were. */
const tab = computed<Tab>({
  get: () => (['readable', 'visual', 'requirements'] as const)
    .find(value => value === route.query.tab) ?? 'readable',
  set: value => router.replace({ query: { ...route.query, tab: value } })
})

const TABS: { value: Tab, label: string }[] = [
  { value: 'readable', label: 'instructorProjects.readable_files' },
  { value: 'visual', label: 'instructorProjects.visual_files' },
  { value: 'requirements', label: 'instructorProjects.requirements' }
]

/** The requirements tab holds the single inline PDF, not a media list. */
const rows = computed<ProjectMedia[]>(() => {
  if (tab.value === 'requirements') {
    const url = store.project?.requirementsFileUrl
    if (!url) return []
    return [{
      id: 'requirements',
      fileName: url.split('/').pop() || url,
      url,
      fileType: 'pdf',
      createdAt: ''
    }]
  }
  // `pdf_media` and `video_media` are separate relationships on the response,
  // so each tab reads its own list rather than filtering one.
  return tab.value === 'visual'
    ? (store.project?.videoFiles ?? [])
    : (store.project?.readableFiles ?? [])
})

/** Only the two media tabs carry a mandatory-review flag. */
const reviewBadge = computed(() => {
  if (tab.value === 'requirements' || !store.project) return null
  const required = tab.value === 'visual'
    ? store.project.watchVideos
    : store.project.watchPdf
  return required
    ? t('instructorProjects.required_to_watch')
    : t('instructorProjects.optional_to_watch')
})

const emptyMessage = computed(() => tab.value === 'requirements'
  ? t('instructorProjects.no_requirements_file')
  : t('instructorProjects.no_files'))

const headings = computed(() => [
  t('instructorProjects.file_name'),
  t('instructorProjects.actions')
])

onMounted(() => {
  store.resetProject()
  store.fetchProject(pathId.value)
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
      <p
        v-if="pathName"
        class="font-medium"
      >
        {{ pathName }}
      </p>
    </div>

    <div class="flex justify-center">
      <div class="flex max-w-full gap-1 overflow-x-auto rounded-full bg-elevated p-1">
        <button
          v-for="item in TABS"
          :key="item.value"
          type="button"
          class="shrink-0 rounded-full px-5 py-2 text-sm font-medium transition"
          :class="tab === item.value
            ? 'bg-default text-default shadow-sm'
            : 'text-muted hover:text-default'"
          @click="tab = item.value"
        >
          {{ t(item.label) }}
        </button>
      </div>
    </div>

    <div
      v-if="store.project?.finalGrade || reviewBadge"
      class="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-default bg-elevated p-4"
    >
      <p
        v-if="store.project?.finalGrade"
        class="text-sm"
      >
        {{ t('instructorProjects.final_degree') }}:
        <span class="font-bold">{{ store.project.finalGrade }}</span>
      </p>
      <UBadge
        v-if="reviewBadge"
        variant="soft"
        color="neutral"
      >
        {{ reviewBadge }}
      </UBadge>
    </div>

    <template v-if="store.isLoadingProject || rows.length">
      <SharedDataDisplayAppTable
        :headings="headings"
        :loading="store.isLoadingProject"
      >
        <tr
          v-for="row in rows"
          :key="row.id"
        >
          <td class="p-4">
            <span
              class="truncate font-medium"
              :title="row.fileName"
            >{{ row.fileName }}</span>
          </td>
          <td class="p-4 text-end">
            <UButton
              :to="row.url"
              target="_blank"
              external
              size="xs"
              variant="soft"
              :icon="tab === 'visual' ? 'i-lucide-play' : 'i-lucide-eye'"
            >
              {{ tab === 'visual'
                ? t('instructorProjects.watch')
                : t('instructorProjects.view') }}
            </UButton>
          </td>
        </tr>
      </SharedDataDisplayAppTable>
    </template>

    <p
      v-else
      class="rounded-xl border border-default bg-default py-16 text-center text-muted"
    >
      {{ emptyMessage }}
    </p>
  </div>
</template>
