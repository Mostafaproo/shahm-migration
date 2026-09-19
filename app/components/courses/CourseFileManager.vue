<script setup lang="ts">
import { useCourseFilesStore } from '~/stores/courseFiles'
import { detachAction } from '~/types/media'
import type { MediaFile } from '~/types/media'
import type { FileManagerVariant } from '~/stores/courseFiles'

const props = withDefaults(
  defineProps<{ courseId: string, variant?: FileManagerVariant }>(),
  { variant: 'student' }
)

const store = useCourseFilesStore()
const { t } = useI18n()
const { $appToast: toast } = useNuxtApp()

const isStudent = computed(() => props.variant === 'student')

const headings = computed(() => isStudent.value
  ? [t('files.file_name'), t('files.file_date'), '']
  : [t('files.file_name'), t('files.file_date'), t('files.status'), ''])

/** `null` is the "all types" entry the legacy gets from the select's clear button. */
const filterItems = computed(() => [
  { label: t('files.all_types'), value: null as string | null },
  ...store.filterOptions.map(o => ({ label: o.value, value: o.key as string | null }))
])

const uploadOpen = ref(false)

/** Legacy toasts `message.deleted_successfully` after a detach; prefer the
 *  server's own wording when it sends one. */
async function removeFile(file: MediaFile) {
  const message = await store.detach(file)
  if (message !== null) toast.success(message || t('files.deleted_successfully'))
}

watch(
  () => [props.courseId, props.variant] as const,
  ([id, side]) => {
    store.reset()
    store.fetchList(id, side)
  },
  { immediate: true }
)
</script>

<template>
  <div class="space-y-4">
    <div
      v-if="!isStudent"
      class="flex justify-end"
    >
      <UButton
        icon="i-lucide-upload"
        @click="uploadOpen = true"
      >
        {{ t('upload.upload_to_course') }}
      </UButton>
    </div>

    <div
      v-if="isStudent && store.filterOptions.length"
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

    <template v-if="store.isLoading || store.items.length">
      <SharedDataDisplayAppTable
        :headings="headings"
        :loading="store.isLoading"
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
            {{ file.createdAt || '—' }}
          </td>
          <!-- Instructor: toggle whether students can see the file -->
          <td
            v-if="!isStudent"
            class="p-4"
          >
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

            <!-- Gated on the row carrying a `detach-media` action, exactly as
                 the legacy's `hasPermission(row, 'detach-media')` does. -->
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

    <CoursesMediaUploadModal
      v-if="!isStudent"
      v-model="uploadOpen"
      :course-id="courseId"
      @uploaded="store.fetchList(courseId, variant)"
    />
  </div>
</template>
