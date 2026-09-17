<script setup lang="ts">
const props = defineProps<{
  src: string | null
  loading?: boolean
}>()

const emit = defineEmits<{ select: [file: File] }>()

const { t } = useI18n()
const { $appToast } = useNuxtApp()

const input = ref<HTMLInputElement | null>(null)
/** Local object URL so the new photo shows before the form is saved. */
const preview = ref<string | null>(null)

const shown = computed(() => preview.value ?? props.src)

const MAX_BYTES = 10 * 1024 * 1024

function onPick(event: Event) {
  const file = (event.target as HTMLInputElement).files?.[0]
  if (!file) return

  if (file.size > MAX_BYTES) {
    $appToast.error(t('user.photo_too_large', { name: file.name }))
    if (input.value) input.value.value = ''
    return
  }

  if (preview.value) URL.revokeObjectURL(preview.value)
  preview.value = URL.createObjectURL(file)
  emit('select', file)

  // Let the same file be picked again after a failed upload.
  if (input.value) input.value.value = ''
}

onBeforeUnmount(() => {
  if (preview.value) URL.revokeObjectURL(preview.value)
})
</script>

<template>
  <div class="flex flex-col items-center gap-2">
    <div class="relative">
      <img
        v-if="shown"
        :src="shown"
        alt=""
        class="h-24 w-24 rounded-full object-cover ring-2 ring-default"
      >
      <div
        v-else
        class="flex h-24 w-24 items-center justify-center rounded-full bg-elevated"
      >
        <UIcon
          name="i-lucide-user"
          class="h-10 w-10 text-muted"
        />
      </div>

      <div
        v-if="loading"
        class="absolute inset-0 flex items-center justify-center rounded-full bg-default/70"
      >
        <UIcon
          name="i-lucide-loader-circle"
          class="h-6 w-6 animate-spin text-primary"
        />
      </div>

      <label
        class="absolute -bottom-1 left-1/2 flex h-8 w-8 -translate-x-1/2 cursor-pointer items-center justify-center rounded-full bg-primary text-inverted ring-2 ring-default"
        :title="t('user.change_photo')"
      >
        <UIcon
          name="i-lucide-pencil"
          class="h-4 w-4"
        />
        <input
          ref="input"
          type="file"
          accept="image/png, image/jpeg"
          class="sr-only"
          :disabled="loading"
          @change="onPick"
        >
        <span class="sr-only">{{ t('user.change_photo') }}</span>
      </label>
    </div>

    <p class="pt-2 text-xs text-muted">
      {{ t('user.photo_hint') }}
    </p>
  </div>
</template>
