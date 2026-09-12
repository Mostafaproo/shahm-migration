<script setup lang="ts">
// Single course detail page — ported from shaham-go-fe's
// pages/home/courses/_id.vue, new design. Confirmed live that
// `GET landing-page/courses/{id}` already embeds sessions and rating
// details as relationships — unlike the legacy page, no separate
// `/ratings` or `/sessions` round trips are needed.
import { toCourseDetail } from '~/types/course'
import type { RawCourseDetail } from '~/types/course'

definePageMeta({ layout: 'landing' })

const route = useRoute()
const http = useHttp()
const { locale, t } = useI18n()

const { data: course, status } = await useAsyncData(`course-${route.params.id}`, async () => {
  const res = await http.get<{ data?: RawCourseDetail }>(`${locale.value}/landing-page/courses/${route.params.id}`)
  return res?.data ? toCourseDetail(res.data) : null
})
const isLoading = computed(() => status.value === 'pending')

const instructorNames = computed(() =>
  course.value?.instructors.map(i => i.name).filter(Boolean).join(' - ') ?? ''
)
</script>

<template>
  <UContainer class="py-10">
    <div
      v-if="isLoading"
      class="space-y-4"
    >
      <USkeleton class="h-72 w-full rounded-xl" />
      <USkeleton class="h-8 w-2/3" />
      <USkeleton class="h-4 w-1/3" />
    </div>

    <p
      v-else-if="!course"
      class="py-16 text-center text-muted"
    >
      {{ t('courses.no_results') }}
    </p>

    <div
      v-else
      class="grid grid-cols-1 gap-8 lg:grid-cols-3"
    >
      <div class="space-y-8 lg:col-span-2">
        <div class="relative overflow-hidden rounded-xl">
          <video
            v-if="course.image && course.image.endsWith('.mp4')"
            :src="course.image"
            controls
            playsinline
            class="h-72 w-full bg-black object-contain sm:h-96"
          />
          <img
            v-else
            :src="course.image"
            :alt="course.name"
            class="h-72 w-full object-cover sm:h-96"
          >
          <span
            v-if="course.schoolName"
            class="absolute inset-x-0 bottom-0 bg-black/70 px-4 py-2 text-sm text-white"
          >
            {{ t('courses.by_school') }} <strong>{{ course.schoolName }}</strong>
          </span>
        </div>

        <div class="space-y-3">
          <div class="flex flex-wrap items-center gap-4 text-sm text-muted">
            <span class="flex items-center gap-1">
              <UIcon
                name="i-lucide-star"
                class="h-4 w-4 text-yellow-400"
              />
              {{ course.ratingStars }}/{{ course.ratingTotalStars }}
              <span v-if="course.totalStudentsRatings">({{ course.totalStudentsRatings }} {{ t('courses.reviews') }})</span>
            </span>
            <span class="flex items-center gap-1">
              <UIcon
                name="i-lucide-eye"
                class="h-4 w-4"
              />
              {{ course.viewsCount }}
            </span>
            <span
              v-if="course.remainingPlaces"
              class="flex items-center gap-1"
            >
              <UIcon
                name="i-lucide-users"
                class="h-4 w-4"
              />
              {{ course.remainingPlaces }} {{ t('courses.remaining_places') }}
            </span>
          </div>

          <h1 class="text-2xl font-bold">
            {{ course.name }}
          </h1>

          <div
            v-if="instructorNames"
            class="flex items-center gap-2"
          >
            <img
              v-if="course.instructors[0]?.profilePicture"
              :src="course.instructors[0].profilePicture"
              class="h-8 w-8 rounded-full object-cover"
              alt=""
            >
            <span class="text-sm text-muted">{{ t('courses.by') }} {{ instructorNames }}</span>
          </div>
        </div>

        <div
          v-if="course.whatWeWillLearn"
          class="space-y-3"
        >
          <h2 class="text-lg font-semibold">
            {{ t('courses.what_learn') }}
          </h2>
          <div
            class="prose prose-sm max-w-none"
            v-html="course.whatWeWillLearn"
          />
        </div>

        <div
          v-if="course.description"
          class="space-y-3"
        >
          <h2 class="text-lg font-semibold">
            {{ t('courses.course_description') }}
          </h2>
          <div
            class="prose prose-sm max-w-none"
            v-html="course.description"
          />
        </div>

        <div class="space-y-4">
          <h2 class="text-lg font-semibold">
            {{ t('courses.student_rate') }}
          </h2>

          <div
            v-if="course.ratingBreakdown.length"
            class="space-y-2"
          >
            <div
              v-for="bar in course.ratingBreakdown"
              :key="bar.stars"
              class="flex items-center gap-3 text-sm"
            >
              <span class="w-10 shrink-0">{{ bar.stars }}/{{ bar.totalStars }}</span>
              <UProgress
                :model-value="bar.percent"
                class="flex-1"
              />
              <span class="w-10 shrink-0 text-end text-muted">{{ bar.percent }}%</span>
            </div>
          </div>

          <div
            v-if="course.reviews.length"
            class="space-y-4"
          >
            <div
              v-for="review in course.reviews"
              :key="review.id"
              class="flex gap-3 border-t border-default pt-4"
            >
              <img
                v-if="review.image"
                :src="review.image"
                class="h-10 w-10 rounded-full object-cover"
                alt=""
              >
              <div class="space-y-1">
                <div class="flex items-center gap-2">
                  <span class="font-medium">{{ review.name }}</span>
                  <span class="flex items-center gap-0.5 text-xs text-muted">
                    <UIcon
                      name="i-lucide-star"
                      class="h-3 w-3 text-yellow-400"
                    />
                    {{ review.stars }}/{{ review.totalStars }}
                  </span>
                </div>
                <p class="text-sm text-muted">
                  {{ review.details }}
                </p>
              </div>
            </div>
          </div>
          <p
            v-else
            class="text-sm text-muted"
          >
            {{ t('courses.no_reviews') }}
          </p>
        </div>
      </div>

      <div class="space-y-6 lg:col-span-1">
        <div
          v-if="course.price"
          class="rounded-xl border border-default p-5"
        >
          <p class="text-3xl font-bold text-primary">
            {{ course.price }}
          </p>
          <p class="text-xs text-muted">
            {{ t('courses.price_include_tax') }}
          </p>
        </div>

        <div
          v-if="course.sessions.length"
          class="space-y-3"
        >
          <h2 class="text-lg font-semibold">
            {{ t('courses.course_content') }}
          </h2>
          <ul class="space-y-2">
            <li
              v-for="session in course.sessions"
              :key="session.id"
              class="space-y-1 rounded-lg border border-default p-3 text-sm"
            >
              <div class="flex flex-wrap items-center gap-2 text-xs text-muted">
                <UIcon
                  name="i-lucide-clock"
                  class="h-3.5 w-3.5"
                />
                <span v-if="session.date">{{ session.date }}</span>
                <span v-if="session.startTime">{{ session.startTime }} — {{ session.endTime }}</span>
              </div>
              <p>{{ session.content }}</p>
            </li>
          </ul>
        </div>
      </div>
    </div>
  </UContainer>
</template>
