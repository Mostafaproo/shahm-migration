<script setup lang="ts">
import { pathwayInstructors } from '~/types/pathway'
import type { PathwayCourseStatus } from '~/types/pathway'

definePageMeta({
  layout: 'dashboard',
  title: 'pathways.page_title',
  feature: 'learning_path',
  middleware: ['feature-guard', 'role-guard'],
  roles: ['student']
})

const route = useRoute()
const store = usePathwaysStore()
const localePath = useLocalePath()
const { t } = useI18n()

const path = computed(() => store.detail)
const instructors = computed(() => (path.value ? pathwayInstructors(path.value) : []))

const videoOpen = ref(false)

/** Stat strip under the header — the legacy's `path-table`. */
const stats = computed(() => {
  const p = path.value
  if (!p) return []
  return [
    { icon: 'i-lucide-route', label: t('pathways.stats.type'), value: p.typeLabel || p.pathType || '—' },
    { icon: 'i-lucide-book-open', label: t('pathways.stats.courses'), value: String(p.courses.length) },
    { icon: 'i-lucide-calendar', label: t('pathways.stats.duration'), value: p.durationMonths != null ? t('pathways.months', { count: p.durationMonths }) : '—' },
    { icon: 'i-lucide-eye', label: t('pathways.stats.views'), value: String(p.totalViews) },
    { icon: 'i-lucide-users', label: t('pathways.stats.subscribers'), value: String(p.totalSubscribers) }
  ]
})

const STATUS_STYLE: Record<PathwayCourseStatus, { color: 'success' | 'primary' | 'neutral', key: string }> = {
  'completed': { color: 'success', key: 'pathways.status.completed' },
  'in-progress': { color: 'primary', key: 'pathways.status.in_progress' },
  'not-started': { color: 'neutral', key: 'pathways.status.not_started' }
}

onMounted(() => store.fetchOne(String(route.params.id)))
</script>

<template>
  <div
    v-if="store.isLoadingDetail && !path"
    class="space-y-4"
  >
    <USkeleton class="h-56 w-full rounded-xl" />
    <USkeleton class="h-20 w-full rounded-xl" />
    <USkeleton class="h-40 w-full rounded-xl" />
  </div>

  <p
    v-else-if="!path"
    class="py-16 text-center text-muted"
  >
    {{ t('pathways.no_pathways') }}
  </p>

  <div
    v-else
    class="space-y-6"
  >
    <!-- Header -->
    <div class="grid grid-cols-1 gap-6 rounded-xl border border-default bg-default p-5 sm:p-6 lg:grid-cols-3">
      <div class="space-y-4 lg:col-span-2">
        <UBadge
          v-if="path.badge"
          color="primary"
          variant="subtle"
        >
          {{ path.badge }}
        </UBadge>

        <h1 class="text-2xl font-bold">
          {{ path.name }}
        </h1>

        <div
          v-if="path.isSubscribed"
          class="max-w-md space-y-1.5"
        >
          <div class="flex items-center justify-between text-sm">
            <span class="font-semibold text-primary">{{ path.progress }}%</span>
            <span
              v-if="path.lastCourseName"
              class="truncate text-muted"
            >{{ path.lastCourseName }}</span>
          </div>
          <UProgress :model-value="path.progress" />
        </div>

        <div class="flex flex-wrap items-center gap-3">
          <UButton
            v-if="path.isSubscribed && path.lastCourseId"
            :to="localePath(`/student/courses/${path.lastCourseId}`)"
            size="lg"
          >
            {{ path.progress > 0 ? t('pathways.continue') : t('pathways.start') }}
          </UButton>

          <div
            v-else-if="path.cost"
            class="flex flex-wrap items-baseline gap-2"
          >
            <span class="text-2xl font-bold text-primary">
              {{ path.cost }} {{ t('pathways.sar') }}
            </span>
            <span class="text-xs text-muted">({{ t('pathways.tax_included') }})</span>
          </div>

          <UButton
            v-if="path.introVideo"
            color="neutral"
            variant="outline"
            size="lg"
            icon="i-lucide-play"
            @click="videoOpen = true"
          >
            {{ t('pathways.watch_intro') }}
          </UButton>
        </div>
      </div>

      <img
        v-if="path.image"
        :src="path.image"
        :alt="path.name"
        class="h-48 w-full rounded-xl object-cover lg:h-full"
      >
    </div>

    <!-- Stats -->
    <div class="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
      <div
        v-for="stat in stats"
        :key="stat.label"
        class="flex flex-col items-center gap-1 rounded-xl border border-default bg-default p-4 text-center"
      >
        <UIcon
          :name="stat.icon"
          class="h-5 w-5 text-primary"
        />
        <span class="text-sm font-semibold">{{ stat.value }}</span>
        <span class="text-xs text-muted">{{ stat.label }}</span>
      </div>
    </div>

    <div class="grid grid-cols-1 gap-6 lg:grid-cols-3">
      <!-- Steps -->
      <div class="space-y-3 lg:col-span-2">
        <h2 class="text-lg font-bold">
          {{ t('pathways.path_courses') }}
        </h2>

        <div
          v-for="(course, index) in path.courses"
          :key="course.id"
          class="flex gap-4 overflow-hidden rounded-xl border border-default bg-default"
          :class="!course.canAccess && 'opacity-60'"
        >
          <img
            v-if="course.image"
            :src="course.image"
            :alt="course.name"
            class="h-auto w-28 shrink-0 object-cover sm:w-36"
          >

          <div class="flex min-w-0 flex-1 flex-col gap-1.5 py-4 pe-4">
            <div class="flex items-center gap-2">
              <span class="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-elevated text-xs font-bold">
                {{ index + 1 }}
              </span>
              <h3 class="truncate font-bold">
                {{ course.name }}
              </h3>
            </div>

            <p
              v-if="course.instructorName"
              class="truncate text-xs text-muted"
            >
              {{ course.instructorName }}
            </p>

            <UBadge
              :color="STATUS_STYLE[course.status].color"
              variant="subtle"
              size="sm"
              class="w-fit"
            >
              {{ t(STATUS_STYLE[course.status].key) }}
            </UBadge>

            <UProgress
              v-if="course.progress > 0"
              :model-value="course.progress"
              size="sm"
              class="mt-1"
            />

            <UButton
              v-if="course.canAccess"
              :to="localePath(`/student/courses/${course.id}`)"
              class="mt-2 self-start"
              size="xs"
              variant="soft"
            >
              {{ t('pathways.open_course') }}
            </UButton>
            <span
              v-else
              class="mt-2 flex items-center gap-1 text-xs text-muted"
            >
              <UIcon
                name="i-lucide-lock"
                class="h-3.5 w-3.5"
              />
              {{ t('pathways.locked') }}
            </span>
          </div>
        </div>

        <p
          v-if="!path.courses.length"
          class="rounded-xl border border-default bg-default p-6 text-center text-muted"
        >
          {{ t('pathways.no_courses') }}
        </p>
      </div>

      <!-- About -->
      <div class="space-y-5 rounded-xl border border-default bg-default p-5 lg:col-span-1">
        <section v-if="path.description">
          <h3 class="mb-1.5 font-bold">
            {{ t('pathways.about') }}
          </h3>
          <p class="whitespace-pre-line text-sm text-muted">
            {{ path.description }}
          </p>
        </section>

        <section v-if="path.objective">
          <h3 class="mb-1.5 font-bold">
            {{ t('pathways.objective') }}
          </h3>
          <p class="whitespace-pre-line text-sm text-muted">
            {{ path.objective }}
          </p>
        </section>

        <section v-if="path.whatYouWillLearn">
          <h3 class="mb-1.5 font-bold">
            {{ t('pathways.what_you_learn') }}
          </h3>
          <p class="whitespace-pre-line text-sm text-muted">
            {{ path.whatYouWillLearn }}
          </p>
        </section>
      </div>
    </div>

    <!-- Final project -->
    <div
      v-if="path.finalProject"
      class="flex flex-wrap items-center justify-between gap-4 rounded-xl border border-default bg-default p-5"
    >
      <div class="space-y-1">
        <h2 class="text-lg font-bold">
          {{ t('pathways.final_project') }}
        </h2>
        <p
          v-if="path.finalProject.hint"
          class="text-sm text-muted"
        >
          {{ path.finalProject.hint }}
        </p>
        <p
          v-if="path.finalProject.totalScore !== null"
          class="text-sm text-muted"
        >
          {{ t('pathways.total_score') }}: {{ path.finalProject.totalScore }}
        </p>
      </div>

      <UBadge
        v-if="!path.finalProject.isAccessible"
        color="neutral"
        variant="subtle"
        icon="i-lucide-lock"
      >
        {{ t('pathways.locked') }}
      </UBadge>
    </div>

    <!-- Certificate -->
    <div
      v-if="path.certificateDescription"
      class="flex items-start gap-3 rounded-xl border border-default bg-default p-5"
    >
      <UIcon
        name="i-lucide-award"
        class="h-6 w-6 shrink-0 text-primary"
      />
      <div>
        <h2 class="font-bold">
          {{ t('pathways.certificate') }}
        </h2>
        <p class="text-sm text-muted">
          {{ path.certificateDescription }}
        </p>
      </div>
    </div>

    <!-- Instructors -->
    <div
      v-if="instructors.length"
      class="space-y-3"
    >
      <h2 class="text-lg font-bold">
        {{ t('pathways.instructors') }}
      </h2>
      <div class="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <div
          v-for="instructor in instructors"
          :key="`${instructor.id}-${instructor.courseName}`"
          class="flex items-center gap-3 rounded-xl border border-default bg-default p-4"
        >
          <UAvatar
            :src="instructor.avatar ?? undefined"
            :alt="instructor.name"
            size="lg"
          />
          <div class="min-w-0">
            <p class="truncate font-medium">
              {{ instructor.name }}
            </p>
            <p class="truncate text-xs text-muted">
              {{ instructor.courseName }}
            </p>
          </div>
        </div>
      </div>
    </div>

    <UModal
      v-model:open="videoOpen"
      :title="path.name"
      :ui="{ content: 'max-w-4xl' }"
    >
      <template #body>
        <video
          v-if="path.introVideo"
          :src="path.introVideo"
          controls
          autoplay
          playsinline
          class="max-h-[70vh] w-full rounded-lg bg-black"
        />
      </template>
    </UModal>
  </div>
</template>
