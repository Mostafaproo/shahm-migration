<script setup lang="ts">
const props = defineProps<{
  courseId: string
  sessionId?: string | null
  vcrSessionId?: string | null
  courseEnded?: boolean
}>()

const open = defineModel<boolean>({ required: true })
const emit = defineEmits<{ uploaded: [] }>()

const store = useCourseFilesStore()
const { t } = useI18n()
const { $appToast: toast } = useNuxtApp()

const isSessionUpload = computed(() => Boolean(props.sessionId))

// --- files (course upload)
/** The legacy toasts the attached file's name; the store hands it back. */
async function attach(mediaId: string): Promise<boolean> {
  const fileName = await store.attachMedia(props.courseId, mediaId, props.sessionId)
  if (fileName === null) return false
  if (fileName) toast.success(t('upload.file_uploaded', { name: fileName }))
  return true
}

const detach = (mediaId: string) => store.detachMedia(props.courseId, mediaId, props.sessionId)

/** The list behind the modal is stale the moment anything attaches. */
function onUploaded() {
  emit('uploaded')
}

// --- Google Drive link (session upload)
const link = ref('')
const isSavingLink = ref(false)

async function saveLink() {
  if (!link.value.trim()) {
    toast.warning(t('upload.enter_valid_link'))
    return
  }
  isSavingLink.value = true
  const ok = await store.attachLink(String(props.vcrSessionId ?? ''), link.value.trim())
  isSavingLink.value = false
  if (!ok) return
  link.value = ''
  emit('uploaded')
}

watch(open, (isOpen) => {
  if (!isOpen) link.value = ''
})
</script>

<template>
  <UModal
    v-model:open="open"
    :title="isSessionUpload ? t('upload.session_upload') : t('upload.upload_to_course')"
  >
    <template #body>
      <!-- Session: a Google Drive link instead of a file -->
      <div
        v-if="isSessionUpload"
        class="space-y-3"
      >
        <UFormField :label="t('upload.google_drive_link')">
          <UInput
            v-model="link"
            class="w-full"
            :placeholder="t('upload.enter_google_drive_link')"
            :disabled="courseEnded"
            @keyup.enter="saveLink"
          />
        </UFormField>

        <div class="flex justify-end">
          <UButton
            :loading="isSavingLink"
            :disabled="courseEnded"
            :title="courseEnded ? t('upload.course_ended') : ''"
            @click="saveLink"
          >
            {{ t('upload.save') }}
          </UButton>
        </div>
      </div>

      <!-- Course: the dropzone -->
      <SharedDataInputAppFileUploader
        v-else
        :disabled="courseEnded"
        :attach="attach"
        :detach="detach"
        @uploaded="onUploaded"
        @removed="onUploaded"
      />

      <p
        v-if="courseEnded"
        class="mt-3 text-sm text-warning"
      >
        {{ t('upload.course_ended') }}
      </p>
    </template>
  </UModal>
</template>
