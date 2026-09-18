<script setup lang="ts">
import { toPathwayDetail } from '~/types/pathway'
import type { RawPathwayDetail } from '~/types/pathway'

definePageMeta({ layout: 'landing' })

const route = useRoute()
const http = useHttp()
const localePath = useLocalePath()
const auth = useAuthStore()
const { locale, t } = useI18n()

const { data: path, status } = await useAsyncData(
  `landing-pathway-${route.params.id}`,
  async () => {
    const res = await http.get<{ data?: RawPathwayDetail }>(
      `${locale.value}/landing-page/learning-paths/${route.params.id}`
    )
    return res?.data ? toPathwayDetail(res.data) : null
  }
)

const isLoading = computed(() => status.value === 'pending')
const videoOpen = ref(false)

/** A signed-in student gets sent to their own view, which knows their progress. */
const dashboardLink = computed(() =>
  auth.userType === 'student'
    ? localePath(`/student/pathways/${route.params.id}`)
    : null
)

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
</script>

<template>
  <UContainer class="py-10">
    <div
      v-if="isLoading"
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

          <div class="flex flex-wrap items-center gap-3">
            <div
              v-if="path.cost"
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

            <UButton
              v-if="dashboardLink"
              :to="dashboardLink"
              size="lg"
            >
              {{ t('pathways.open_in_dashboard') }}
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
        <!-- Syllabus — public, so no progress or step locking. -->
        <div class="space-y-3 lg:col-span-2">
          <h2 class="text-lg font-bold">
            {{ t('pathways.path_courses') }}
          </h2>

          <div
            v-for="(course, index) in path.courses"
            :key="course.id"
            class="flex gap-4 overflow-hidden rounded-xl border border-default bg-default"
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

              <UButton
                :to="localePath(`/courses/${course.id}`)"
                class="mt-2 self-start"
                size="xs"
                variant="soft"
              >
                {{ t('pathways.open_course') }}
              </UButton>
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
            <!-- eslint-disable-next-line vue/no-v-html -- backend-authored -->
            <div
              class="prose prose-sm max-w-none"
              v-html="path.description"
            />
          </section>

          <section v-if="path.objective">
            <h3 class="mb-1.5 font-bold">
              {{ t('pathways.objective') }}
            </h3>
            <!-- eslint-disable-next-line vue/no-v-html -- backend-authored -->
            <div
              class="prose prose-sm max-w-none"
              v-html="path.objective"
            />
          </section>

          <section v-if="path.whatYouWillLearn">
            <h3 class="mb-1.5 font-bold">
              {{ t('pathways.what_you_learn') }}
            </h3>
            <!-- eslint-disable-next-line vue/no-v-html -- backend-authored -->
            <div
              class="prose prose-sm max-w-none"
              v-html="path.whatYouWillLearn"
            />
          </section>
        </div>
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
  </UContainer>
</template>
