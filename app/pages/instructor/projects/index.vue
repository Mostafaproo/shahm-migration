<script setup lang="ts">

import { pathTypeKey } from '~/types/instructorProject'
import { PER_PAGE_OPTIONS } from '~/utils/pagination'

definePageMeta({
  layout: 'dashboard',
  title: 'instructorProjects.page_title',
  feature: 'learning_path',
  middleware: ['feature-guard', 'role-guard'],
  roles: ['instructor']
})

const store = useInstructorProjectsStore()
const localePath = useLocalePath()
const { t } = useI18n()

const searchDraft = ref('')
const perPageItems = PER_PAGE_OPTIONS.map(n => ({ label: String(n), value: n }))

const headings = computed(() => [
  t('instructorProjects.path_name'),
  t('instructorProjects.path_type'),
  t('instructorProjects.actions')
])

/** Legacy falls through to the raw value for any type it does not know. */
function typeLabel(pathType: string): string {
  const key = pathTypeKey(pathType)
  return key ? t(key) : pathType
}

function submitSearch() {
  store.setSearch(searchDraft.value)
}

function clearSearch() {
  searchDraft.value = ''
  store.setSearch('')
}

onMounted(() => store.fetchPaths(1))
</script>

<template>
  <div class="space-y-5">
    <form
      class="flex flex-wrap items-center gap-2"
      @submit.prevent="submitSearch"
    >
      <UInput
        v-model="searchDraft"
        icon="i-lucide-search"
        class="min-w-0 flex-1 sm:max-w-md"
        :placeholder="t('instructorProjects.search_by_path')"
      />
      <UButton type="submit">
        {{ t('instructorProjects.search') }}
      </UButton>
      <UButton
        v-if="store.search"
        color="neutral"
        variant="ghost"
        icon="i-lucide-rotate-ccw"
        @click="clearSearch"
      >
        {{ t('instructorProjects.clear_filter') }}
      </UButton>

      <div class="ms-auto flex items-center gap-2 text-sm text-muted">
        <span>{{ t('instructorProjects.show') }}</span>
        <USelectMenu
          :model-value="store.perPage"
          :items="perPageItems"
          value-key="value"
          class="w-24"
          @update:model-value="value => store.setPerPage(Number(value))"
        />
        <span>{{ t('instructorProjects.entries') }}</span>
      </div>
    </form>

    <template v-if="store.isLoading || store.paths.length">
      <SharedDataDisplayAppTable
        :headings="headings"
        :loading="store.isLoading"
      >
        <tr
          v-for="path in store.paths"
          :key="path.id"
        >
          <td class="p-4 font-medium">
            {{ path.name }}
          </td>
          <td class="p-4 text-muted">
            {{ typeLabel(path.pathType) || '—' }}
          </td>
          <td class="p-4">
            <div class="flex flex-wrap items-center gap-1">
              <UButton
                :to="localePath({
                  path: '/instructor/projects/form',
                  query: { pathId: path.id, pathName: path.name }
                })"
                size="xs"
                variant="soft"
                :icon="path.hasFinalProject ? 'i-lucide-pencil' : 'i-lucide-plus'"
              >
                {{ path.hasFinalProject
                  ? t('instructorProjects.edit_project')
                  : t('instructorProjects.add_project') }}
              </UButton>

              <!-- Only a path that already has one has anything to view. -->
              <UButton
                v-if="path.hasFinalProject"
                :to="localePath({
                  path: '/instructor/projects/view',
                  query: { pathId: path.id, pathName: path.name }
                })"
                size="xs"
                variant="ghost"
                icon="i-lucide-eye"
              >
                {{ t('instructorProjects.view_project') }}
              </UButton>

              <UButton
                :to="localePath(`/instructor/projects/students/${path.id}`)"
                size="xs"
                variant="ghost"
                icon="i-lucide-users"
              >
                {{ t('instructorProjects.view_students') }}
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
      {{ t('instructorProjects.no_paths') }}
    </p>
  </div>
</template>
