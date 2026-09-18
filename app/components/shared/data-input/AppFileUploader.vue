<script setup lang="ts">
import { bytesToSize } from '~/utils/format'

export interface UploadedFile {
  mediaId: string
  file: File
}

const props = withDefaults(defineProps<{
  multiple?: boolean
  maxFileSize?: number
  allowedTypes?: string[]
  disabled?: boolean
  attach?: (mediaId: string, file: File) => Promise<boolean>
  detach?: (mediaId: string) => Promise<boolean>
}>(), {
  multiple: true,
  maxFileSize: 10,
  allowedTypes: () => ['pdf', 'doc', 'docx', 'jpg', 'jpeg', 'png', 'mp4'],
  disabled: false,
  attach: undefined,
  detach: undefined
})

const emit = defineEmits<{
  uploaded: [UploadedFile]
  removed: [string]
}>()

const { t } = useI18n()
const { $appToast: toast } = useNuxtApp()
const { upload } = useMediaUpload()

interface Row {
  file: File
  percent: number
  finished: boolean
  canceled: boolean
  removing: boolean
  mediaId: string | null
  abort: (() => void) | null
}

const rows = ref<Row[]>([])
const input = useTemplateRef<HTMLInputElement>('input')
const isDragging = ref(false)

const acceptAttr = computed(() => props.allowedTypes.map(type => `.${type}`).join(','))
const allowedTypesText = computed(() => props.allowedTypes.map(type => `.${type}`).join(', '))

function accept(incoming: File[]): File[] | null {
  if (!props.multiple && rows.value.length) {
    toast.warning(t('upload.only_one_file'))
    return null
  }

  const batch = props.multiple ? incoming : incoming.slice(0, 1)

  for (const file of batch) {
    if (file.size / 1024 ** 2 > props.maxFileSize) {
      toast.warning(t('upload.file_too_large', { name: file.name, size: props.maxFileSize }))
      return null
    }
    const extension = file.name.split('.').pop()?.toLowerCase()
    if (!extension || !props.allowedTypes.includes(extension)) {
      toast.warning(`${t('upload.allowed_types')} ${props.allowedTypes.join(', ')}`)
      return null
    }
  }

  return batch
}

function enqueue(incoming: File[]) {
  if (props.disabled) return
  const batch = accept(incoming)
  if (!batch?.length) return

  const start = rows.value.length
  rows.value.push(...batch.map(file => ({
    file,
    percent: 0,
    finished: false,
    canceled: false,
    removing: false,
    mediaId: null,
    abort: null
  })))

  void run(start)
}

/** Sequential, like the legacy's `for` loop over an awaited upload. */
async function run(from: number) {
  for (let i = from; i < rows.value.length; i++) {
    const row = rows.value[i]
    if (!row || row.finished || row.canceled) continue

    const handle = upload(row.file, (percent) => {
      row.percent = percent
    })
    row.abort = handle.abort

    const mediaId = await handle.done
    row.abort = null

    if (!mediaId) {
      row.canceled = true
      continue
    }

    if (props.attach) {
      const ok = await props.attach(mediaId, row.file).catch(() => false)
      if (ok === false) {
        row.canceled = true
        continue
      }
    }

    row.mediaId = mediaId
    row.finished = true
    row.percent = 100
    emit('uploaded', { mediaId, file: row.file })
  }
}

function onPick(event: Event) {
  const target = event.target as HTMLInputElement
  enqueue([...(target.files ?? [])])
  // Reset so re-picking the same file fires `change` again.
  target.value = ''
}

function onDrop(event: DragEvent) {
  isDragging.value = false
  enqueue([...(event.dataTransfer?.files ?? [])])
}

function cancel(index: number) {
  const row = rows.value[index]
  if (!row?.abort) return
  row.abort()
  row.canceled = true
}

async function remove(index: number) {
  const row = rows.value[index]
  if (!row) return

  if (!row.mediaId) {
    rows.value.splice(index, 1)
    return
  }

  if (props.detach) {
    row.removing = true
    const ok = await props.detach(row.mediaId).catch(() => false)
    row.removing = false
    if (ok === false) return
  }

  const mediaId = row.mediaId
  rows.value.splice(index, 1)
  emit('removed', mediaId)
}

defineExpose({
  clear: () => {
    rows.value = []
  }
})
</script>

<template>
  <div class="space-y-4">
    <p class="text-sm text-muted">
      {{ t('upload.allowed_types') }} {{ allowedTypesText }}
      {{ t('upload.max_size', { size: maxFileSize }) }}
    </p>

    <button
      type="button"
      class="flex w-full flex-col items-center gap-2 rounded-xl border-2 border-dashed p-8 transition"
      :class="[
        isDragging ? 'border-primary bg-primary/5' : 'border-default hover:border-primary/60',
        disabled ? 'cursor-not-allowed opacity-60' : 'cursor-pointer'
      ]"
      :disabled="disabled"
      @click="input?.click()"
      @dragenter.prevent="isDragging = true"
      @dragover.prevent="isDragging = true"
      @dragleave.prevent="isDragging = false"
      @drop.prevent="onDrop"
    >
      <UIcon
        name="i-lucide-cloud-upload"
        class="h-10 w-10 text-primary"
      />
      <span class="font-medium">{{ t('upload.drag_or_click') }}</span>
      <span class="text-sm text-muted">{{ t('upload.select_file') }}</span>
    </button>

    <input
      ref="input"
      type="file"
      class="hidden"
      :multiple="multiple"
      :accept="acceptAttr"
      @change="onPick"
    >

    <ul
      v-if="rows.length"
      class="space-y-2"
    >
      <li
        v-for="(row, index) in rows"
        :key="`${row.file.name}-${index}`"
        class="flex items-center gap-3 rounded-xl border border-default bg-default p-3"
      >
        <UIcon
          name="i-lucide-file"
          class="h-5 w-5 shrink-0 text-muted"
        />

        <div class="min-w-0 flex-1 space-y-1">
          <p
            class="truncate text-sm font-medium"
            :title="row.file.name"
          >
            {{ row.file.name }}
          </p>

          <template v-if="!row.finished && !row.canceled">
            <UProgress
              :model-value="row.percent"
              size="sm"
            />
            <p class="text-xs text-muted">
              {{ t('upload.uploading') }} {{ row.percent }}% —
              {{ bytesToSize(row.file.size * (row.percent / 100)) }}
              / {{ bytesToSize(row.file.size) }}
            </p>
          </template>

          <p
            v-else-if="row.canceled"
            class="text-xs text-error"
          >
            {{ t('upload.canceled') }}
          </p>

          <p
            v-else
            class="text-xs text-success"
          >
            {{ t('upload.uploaded') }} — {{ bytesToSize(row.file.size) }}
          </p>
        </div>

        <UButton
          v-if="!row.finished && !row.canceled"
          size="xs"
          variant="ghost"
          color="neutral"
          icon="i-lucide-x"
          :aria-label="t('upload.cancel')"
          @click="cancel(index)"
        />
        <UButton
          v-else
          size="xs"
          variant="ghost"
          color="error"
          icon="i-lucide-trash-2"
          :loading="row.removing"
          :aria-label="t('upload.remove')"
          @click="remove(index)"
        />
      </li>
    </ul>
  </div>
</template>
