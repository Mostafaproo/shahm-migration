<script setup lang="ts">
import { detachAction } from '~/types/media'
import type { MediaFile } from '~/types/media'

definePageMeta({
  layout: 'dashboard',
  title: 'files.media_library',
  middleware: 'role-guard',
  roles: ['instructor']
})

const store = useCourseFilesStore()
const { t } = useI18n()
const { $appToast: toast } = useNuxtApp()

// Both "all" entries are `null`, never `''`: Reka UI's Combobox reserves the
// empty string for clearing the selection and throws on an item that uses it.
const courseId = ref<string | null>(null)
const extension = ref<string | null>(null)
const from = ref('')
const to = ref('')

/** The legacy's `disabledAfterToday`: today is selectable, tomorrow is not. */
const today = new Date().toISOString().slice(0, 10)

const courseItems = computed(() => [
  { label: t('files.all_courses'), value: null as string | null },
  ...store.courseOptions.map(o => ({ label: o.value, value: o.key as string | null }))
])

const typeItems = computed(() => [
  { label: t('files.all_types'), value: null as string | null },
  ...store.filterOptions.map(o => ({ label: o.value, value: o.key as string | null }))
])

const headings = computed(() => [
  t('files.file_name'),
  t('files.course'),
  t('files.file_date'),
  t('files.file_type'),
  t('files.status'),
  t('files.download_count'),
  ''
])

const hasFilters = computed(() =>
  Boolean(courseId.value || extension.value || from.value || to.value))

function apply() {
  store.setLibraryFilters({
    courseId: courseId.value ?? '',
    extension: extension.value,
    from: from.value,
    to: to.value
  })
}

/** The legacy has no way back to the unfiltered list once a date is picked. */
function resetFilters() {
  courseId.value = null
  extension.value = null
  from.value = ''
  to.value = ''
  apply()
}

async function removeFile(file: MediaFile) {
  const message = await store.detach(file)
  if (message !== null) toast.success(message || t('files.deleted_successfully'))
}

onMounted(() => {
  // `courseFiles` is a singleton shared with the course Files tab, so anything
  // that tab left behind (a course id, an extension filter) would leak in here.
  store.reset()
  store.fetchList('', 'instructor')
})
</script>

<template>
  <div class="space-y-5">
    <!-- Filters -->
    <div class="space-y-3 rounded-xl border border-default bg-default p-4">
      <div class="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <UFormField :label="t('files.start_date')">
          <UInput
            v-model="from"
            type="date"
            class="w-full"
            :max="to || today"
            @change="apply"
          />
        </UFormField>

        <UFormField :label="t('files.end_date')">
          <UInput
            v-model="to"
            type="date"
            class="w-full"
            :min="from || undefined"
            :max="today"
            @change="apply"
          />
        </UFormField>

        <UFormField :label="t('files.course')">
          <USelectMenu
            v-model="courseId"
            :items="courseItems"
            value-key="value"
            class="w-full"
            :placeholder="t('files.choose_course')"
            @update:model-value="apply"
          />
        </UFormField>

        <UFormField :label="t('files.file_type')">
          <USelectMenu
            v-model="extension"
            :items="typeItems"
            value-key="value"
            class="w-full"
            :placeholder="t('files.choose_type')"
            @update:model-value="apply"
          />
        </UFormField>
      </div>

      <div
        v-if="hasFilters"
        class="flex justify-end"
      >
        <UButton
          color="neutral"
          variant="ghost"
          size="sm"
          icon="i-lucide-rotate-ccw"
          @click="resetFilters"
        >
          {{ t('files.reset_filters') }}
        </UButton>
      </div>
    </div>

    <!-- The table stays put while a filter reloads, so the header and the
         layout do not flicker between every change. -->
    <template v-if="store.isLoading || store.items.length">
      <SharedDataDisplayAppTable
        :headings="headings"
        :loading="store.isLoading"
        :loading-rows="8"
      >
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
            {{ file.courseTitle || '—' }}
          </td>

          <td class="p-4 text-muted">
            {{ file.createdAt || '—' }}
          </td>

          <td class="p-4 text-muted">
            {{ file.extension || '—' }}
          </td>

          <td class="p-4">
            <UButton
              size="xs"
              variant="ghost"
              :color="file.active ? 'success' : 'neutral'"
              :icon="file.active ? 'i-lucide-globe' : 'i-lucide-ban'"
              :loading="store.isBusy(`status:${file.id}`)"
              @click="store.toggleActive(file)"
            >
              {{ file.active ? t('files.activated') : t('files.deactivated') }}
            </UButton>
          </td>

          <td class="p-4 text-muted">
            {{ file.downloadsCount }}
          </td>

          <td class="p-4">
            <div class="flex items-center justify-end gap-1">
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

              <UButton
                v-if="detachAction(file)"
                size="xs"
                variant="ghost"
                color="error"
                icon="i-lucide-trash-2"
                :loading="store.isBusy(`detach:${file.id}`)"
                @click="removeFile(file)"
              >
                {{ t('files.delete') }}
              </UButton>
            </div>
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
          @click="store.loadMore(courseId ?? '')"
        >
          {{ t('files.load_more') }}
        </UButton>
      </div>
    </template>

    <p
      v-else
      class="rounded-xl border border-default bg-default py-16 text-center text-muted"
    >
      {{ t('files.no_media') }}
    </p>
  </div>
</template>
