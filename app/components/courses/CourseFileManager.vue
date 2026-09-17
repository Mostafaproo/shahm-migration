<script setup lang="ts">
import { useCourseFilesStore } from '~/stores/courseFiles'

const props = defineProps<{ courseId: string }>()

const store = useCourseFilesStore()
const { t } = useI18n()

/** `null` is the "all types" entry the legacy gets from the select's clear button. */
const filterItems = computed(() => [
  { label: t('files.all_types'), value: null as string | null },
  ...store.filterOptions.map(o => ({ label: o.value, value: o.key as string | null }))
])

watch(
  () => props.courseId,
  (id) => {
    store.reset()
    store.fetchList(id)
  },
  { immediate: true }
)
</script>

<template>
  <div class="space-y-4">
    <div
      v-if="store.filterOptions.length"
      class="flex justify-end"
    >
      <USelectMenu
        :model-value="store.extension"
        :items="filterItems"
        value-key="value"
        class="w-56"
        :placeholder="t('files.choose_type')"
        @update:model-value="value => store.setExtension(courseId, (value as string | null) ?? null)"
      />
    </div>

    <div
      v-if="store.isLoading && !store.items.length"
      class="space-y-2"
    >
      <USkeleton
        v-for="n in 5"
        :key="n"
        class="h-14 w-full"
      />
    </div>

    <template v-else-if="store.items.length">
      <SharedDataDisplayAppTable :headings="[t('files.file_name'), t('files.file_date'), '']">
        <tr
          v-for="file in store.items"
          :key="file.id"
        >
          <td class="p-4">
            <div class="flex items-center gap-2">
              <span
                v-if="file.extension"
                class="shrink-0 rounded bg-elevated px-2 py-1 text-xs font-semibold text-muted"
              >
                {{ file.extension }}
              </span>
              <span
                class="truncate"
                :title="file.fileName"
              >{{ file.fileName }}</span>
            </div>
          </td>
          <td class="p-4 text-muted">
            {{ file.createdAt || '—' }}
          </td>
          <td class="p-4 text-end">
            <UButton
              v-if="file.url"
              :to="file.url"
              target="_blank"
              external
              size="xs"
              variant="ghost"
              icon="i-lucide-download"
            >
              {{ t('files.download') }}
            </UButton>
          </td>
        </tr>
      </SharedDataDisplayAppTable>

      <div
        v-if="store.hasMore"
        class="flex justify-center"
      >
        <UButton
          variant="soft"
          :loading="store.isLoading"
          @click="store.loadMore(courseId)"
        >
          {{ t('files.load_more') }}
        </UButton>
      </div>
    </template>

    <p
      v-else
      class="rounded-xl border border-default bg-default py-16 text-center text-muted"
    >
      {{ t('files.no_files') }}
    </p>
  </div>
</template>
