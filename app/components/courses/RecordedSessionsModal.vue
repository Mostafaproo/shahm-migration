<script setup lang="ts">
import type { CourseSessionItem, SessionRecording } from '~/types/studentCourseDetail'

const props = defineProps<{ session: CourseSessionItem | null }>()
const open = defineModel<boolean>({ required: true })

const store = useStudentCourseDetailStore()
const auth = useAuthStore()

type ModalTab = 'recordings' | 'files'
const tab = ref<ModalTab>('recordings')

const TABS: { value: ModalTab, label: string }[] = [
  { value: 'recordings', label: 'courses.recordings' },
  { value: 'files', label: 'courses.session_files' }
]

// Files cost a request, so only fetch once that tab is actually opened.
watch([open, tab, () => props.session?.id], ([isOpen, current, sessionId]) => {
  if (isOpen && current === 'files' && sessionId) store.fetchSessionFiles(sessionId)
})

watch(open, (isOpen) => {
  if (isOpen) tab.value = 'recordings'
  else closePlayer()
})

// --- Player
const playing = ref<SessionRecording | null>(null)
const videoEl = ref<HTMLVideoElement | null>(null)

function play(recording: SessionRecording) {
  if (!recording.url) return
  playing.value = recording
}

/** Legacy: only students report progress, and only a non-zero percentage. */
function reportProgress() {
  const el = videoEl.value
  const sessionId = props.session?.id
  if (!el || !sessionId || auth.userType !== 'student' || !el.duration) return

  const percentage = Math.round((el.currentTime / el.duration) * 100)
  if (percentage > 0) store.saveProgress(sessionId, percentage)
}

function closePlayer() {
  if (playing.value) reportProgress()
  playing.value = null
}
</script>

<template>
  <UModal
    v-model:open="open"
    :title="$t('courses.recorded_sessions')"
    :ui="{ content: 'max-w-3xl' }"
  >
    <template #body>
      <!-- Player view — replaces the list rather than stacking a second
           dialog, so there's only ever one focus trap in play. -->
      <div
        v-if="playing"
        class="space-y-3"
      >
        <UButton
          variant="ghost"
          color="neutral"
          size="sm"
          icon="i-lucide-arrow-right"
          class="rtl:[&_span:first-child]:rotate-0 ltr:[&_span:first-child]:rotate-180"
          @click="closePlayer"
        >
          {{ $t('courses.recordings') }}
        </UButton>

        <video
          ref="videoEl"
          :src="playing.url"
          controls
          autoplay
          playsinline
          class="max-h-[65vh] w-full rounded-lg bg-black"
          @pause="reportProgress"
        />

        <p class="text-sm font-medium">
          {{ playing.fileName }}
        </p>
      </div>

      <div
        v-else
        class="space-y-4"
      >
        <div class="mx-auto flex w-fit gap-1 rounded-full bg-elevated p-1">
          <button
            v-for="item in TABS"
            :key="item.value"
            type="button"
            class="rounded-full px-4 py-1.5 text-sm font-medium transition"
            :class="tab === item.value ? 'bg-primary text-inverted' : 'text-muted hover:text-default'"
            @click="tab = item.value"
          >
            {{ $t(item.label) }}
          </button>
        </div>

        <!-- التسجيلات -->
        <div v-if="tab === 'recordings'">
          <div
            v-if="session?.recordings.length"
            class="grid grid-cols-1 gap-4 sm:grid-cols-3"
          >
            <div
              v-for="recording in session.recordings"
              :key="recording.id"
              class="space-y-2"
            >
              <button
                type="button"
                class="group flex h-28 w-full items-center justify-center rounded-lg bg-elevated transition hover:bg-accented"
                :aria-label="recording.fileName"
                @click="play(recording)"
              >
                <UIcon
                  name="i-lucide-circle-play"
                  class="h-10 w-10 text-primary transition group-hover:scale-110"
                />
              </button>
              <p
                class="truncate text-sm"
                :title="recording.fileName"
              >
                {{ recording.fileName }}
              </p>
            </div>
          </div>

          <p
            v-else
            class="py-10 text-center text-muted"
          >
            {{ $t('courses.no_recordings') }}
          </p>
        </div>

        <!-- المواد الاثرائية -->
        <div v-else>
          <div
            v-if="store.isLoadingFiles"
            class="space-y-2"
          >
            <USkeleton
              v-for="n in 3"
              :key="n"
              class="h-11 w-full"
            />
          </div>

          <ul
            v-else-if="store.sessionFiles.length"
            class="divide-y divide-default"
          >
            <li
              v-for="file in store.sessionFiles"
              :key="file.id"
              class="flex items-center gap-3 py-3 text-sm"
            >
              <span
                v-if="file.extension"
                class="shrink-0 rounded bg-elevated px-2 py-1 text-xs font-semibold text-muted"
              >
                {{ file.extension }}
              </span>
              <span
                class="min-w-0 flex-1 truncate"
                :title="file.fileName"
              >
                {{ file.fileName }}
              </span>
              <span class="shrink-0 text-xs text-muted">{{ file.createdAt }}</span>
              <UButton
                v-if="file.url"
                :to="file.url"
                target="_blank"
                external
                size="xs"
                variant="ghost"
                icon="i-lucide-download"
                :aria-label="$t('courses.download')"
              />
            </li>
          </ul>

          <p
            v-else
            class="py-10 text-center text-muted"
          >
            {{ $t('courses.no_files') }}
          </p>
        </div>
      </div>
    </template>
  </UModal>
</template>
