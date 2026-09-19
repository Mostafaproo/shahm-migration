<script setup lang="ts">

import { z } from 'zod'
import type { UploadedFile } from '~/components/shared/data-input/AppFileUploader.vue'

definePageMeta({
  layout: 'dashboard',
  title: 'instructorProjects.page_title',
  feature: 'learning_path',
  middleware: ['feature-guard', 'role-guard'],
  roles: ['instructor']
})

const store = useInstructorProjectsStore()
const route = useRoute()
const localePath = useLocalePath()
const { t } = useI18n()
const { $appToast: toast } = useNuxtApp()

const pathId = computed(() => String(route.query.pathId ?? ''))
const pathName = computed(() => String(route.query.pathName ?? ''))

const state = reactive({
  degree: '' as string,
  filesRequired: false,
  videosRequired: false
})

/** The legacy's `required|numeric|min_value:1`, with its own messages. */
const schema = computed(() => z.object({
  degree: z.string()
    .min(1, t('instructorProjects.degree_required'))
    .regex(/^\d+$/, t('instructorProjects.degree_numeric'))
    .refine(v => Number(v) >= 1, t('instructorProjects.degree_min')),
  filesRequired: z.boolean(),
  videosRequired: z.boolean()
}))

// --- requirements PDF: held locally, sent with the form
const requirementsFile = ref<File | null>(null)
const requirementsInput = useTemplateRef<HTMLInputElement>('requirementsInput')

function pickRequirements(event: Event) {
  const target = event.target as HTMLInputElement
  const file = target.files?.[0] ?? null
  if (file && file.size / 1024 ** 2 > 20) {
    toast.warning(t('instructorProjects.file_too_large', { size: 20 }))
    target.value = ''
    return
  }
  requirementsFile.value = file
  target.value = ''
}

// --- reading files: uploaded up front, attached by id
const readingMedia = ref<{ id: string, name: string }[]>([])

function onReadingUploaded(file: UploadedFile) {
  readingMedia.value = [...readingMedia.value, { id: file.mediaId, name: file.file.name }]
}

function onReadingRemoved(mediaId: string) {
  readingMedia.value = readingMedia.value.filter(m => m.id !== mediaId)
}

// --- videos: a Drive link on a separate endpoint
const videoLink = ref('')
const isSavingLink = ref(false)

async function saveVideoLink() {
  if (!videoLink.value.trim()) {
    toast.warning(t('instructorProjects.enter_valid_link'))
    return
  }
  isSavingLink.value = true
  const ok = await store.attachLink(pathId.value, videoLink.value.trim())
  isSavingLink.value = false
  if (ok) videoLink.value = ''
}

async function onSubmit() {
  const ok = await store.saveProject(pathId.value, {
    finalGrade: state.degree,
    watchPdf: state.filesRequired,
    watchVideos: state.videosRequired,
    requirementsFile: requirementsFile.value,
    mediaIds: readingMedia.value.map(m => ({ id: m.id, type: 'medias', fileType: 'pdf' }))
  })
  if (!ok) return
  toast.success(t('instructorProjects.save_success'))
  await navigateTo(localePath('/instructor/projects'))
}

onMounted(async () => {
  store.resetProject()
  if (!pathId.value) return
  await store.fetchProject(pathId.value)
  const existing = store.project
  if (!existing) return
  state.degree = existing.finalGrade
  state.filesRequired = existing.watchPdf
  state.videosRequired = existing.watchVideos
})
</script>

<template>
  <div class="mx-auto max-w-3xl space-y-5">
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

    <h1 class="text-xl font-bold">
      {{ store.projectExists
        ? t('instructorProjects.edit_project')
        : t('instructorProjects.create_title') }}
    </h1>

    <div
      v-if="store.isLoadingProject"
      class="space-y-4 rounded-xl border border-default bg-default p-6"
    >
      <USkeleton
        v-for="n in 4"
        :key="n"
        class="h-11 w-full"
      />
    </div>

    <template v-else>
      <UForm
        :schema="schema"
        :state="state"
        class="space-y-5 rounded-xl border border-default bg-default p-6"
        @submit="onSubmit"
      >
        <UFormField
          :label="t('instructorProjects.final_degree')"
          name="degree"
          required
        >
          <UInput
            v-model="state.degree"
            type="number"
            min="1"
            class="w-full"
            :placeholder="t('instructorProjects.degree_placeholder')"
          />
        </UFormField>

        <!-- Requirements PDF -->
        <div class="space-y-2 border-t border-default pt-4">
          <div class="flex flex-wrap items-center justify-between gap-2">
            <span class="font-medium">{{ t('instructorProjects.requirements') }}</span>
            <UButton
              color="neutral"
              variant="outline"
              icon="i-lucide-upload"
              @click="requirementsInput?.click()"
            >
              {{ t('instructorProjects.upload_files') }}
            </UButton>
          </div>

          <input
            ref="requirementsInput"
            type="file"
            accept=".pdf"
            class="hidden"
            @change="pickRequirements"
          >

          <p
            v-if="requirementsFile"
            class="flex items-center gap-2 text-sm text-muted"
          >
            <UIcon
              name="i-lucide-file"
              class="h-4 w-4"
            />
            {{ requirementsFile.name }}
            <UButton
              size="xs"
              variant="ghost"
              color="error"
              icon="i-lucide-x"
              :aria-label="t('instructorProjects.remove')"
              @click="requirementsFile = null"
            />
          </p>
          <a
            v-else-if="store.project?.requirementsFileUrl"
            :href="store.project.requirementsFileUrl"
            target="_blank"
            rel="noopener"
            class="inline-flex items-center gap-2 text-sm text-primary hover:underline"
          >
            <UIcon
              name="i-lucide-file-text"
              class="h-4 w-4"
            />
            {{ t('instructorProjects.current_requirements_file') }}
          </a>
          <p
            v-else
            class="text-sm text-muted"
          >
            {{ t('instructorProjects.no_requirements_file') }}
          </p>
        </div>

        <!-- Reading files -->
        <div class="space-y-2 border-t border-default pt-4">
          <span class="font-medium">{{ t('instructorProjects.reading_files') }}</span>
          <SharedDataInputAppFileUploader
            :allowed-types="['pdf']"
            :max-file-size="20"
            @uploaded="onReadingUploaded"
            @removed="onReadingRemoved"
          />
        </div>

        <div class="space-y-2 border-t border-default pt-4">
          <UCheckbox
            v-model="state.filesRequired"
            :label="t('instructorProjects.files_required')"
          />
          <UCheckbox
            v-model="state.videosRequired"
            :label="t('instructorProjects.videos_required')"
          />
        </div>

        <div class="flex justify-end">
          <UButton
            type="submit"
            size="lg"
            :loading="store.isSubmitting"
          >
            {{ store.projectExists
              ? t('instructorProjects.edit_project')
              : t('instructorProjects.submit') }}
          </UButton>
        </div>
      </UForm>

      <!-- Videos live on their own endpoint, so this saves independently of
           the form above rather than pretending to be part of it. -->
      <div class="space-y-3 rounded-xl border border-default bg-default p-6">
        <p class="font-medium">
          {{ t('instructorProjects.video_section') }}
        </p>
        <div class="flex flex-wrap items-end gap-2">
          <UFormField
            :label="t('instructorProjects.google_drive_link')"
            class="min-w-0 flex-1"
          >
            <UInput
              v-model="videoLink"
              class="w-full"
              :placeholder="t('instructorProjects.enter_google_drive_link')"
              @keyup.enter="saveVideoLink"
            />
          </UFormField>
          <UButton
            color="neutral"
            variant="outline"
            :loading="isSavingLink"
            @click="saveVideoLink"
          >
            {{ t('instructorProjects.save_link') }}
          </UButton>
        </div>
      </div>
    </template>
  </div>
</template>
