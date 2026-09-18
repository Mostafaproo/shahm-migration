<script setup lang="ts">
import { hasCourseAction } from '~/types/studentCourseDetail'
import type { CourseSessionItem } from '~/types/studentCourseDetail'

definePageMeta({
  layout: 'dashboard', title: 'dashboard.nav.courses',
  middleware: 'role-guard',
  roles: ['student']
})

const route = useRoute()
const store = useStudentCourseDetailStore()
const auth = useAuthStore()
const { t } = useI18n()

type DetailTab = 'overview' | 'discussion' | 'homework' | 'assignments' | 'files'
const tab = ref<DetailTab>('overview')

const course = computed(() => store.course)

// Legacy: everything past the overview needs a subscription, and parents never
// see those tabs at all.
const showSubscriberTabs = computed(() =>
  Boolean(course.value?.isSubscribed) && auth.userType !== 'parent'
)

const TABS = computed(() => {
  const items: { value: DetailTab, label: string }[] = [
    { value: 'overview', label: t('courses.detail_tabs.overview') }
  ]
  if (showSubscriberTabs.value) {
    items.push(
      { value: 'discussion', label: t('courses.detail_tabs.discussion') },
      { value: 'homework', label: t('courses.detail_tabs.homework') },
      { value: 'assignments', label: t('courses.detail_tabs.assignments') },
      { value: 'files', label: t('courses.detail_tabs.files') }
    )
  }
  return items
})

const instructorNames = computed(() =>
  course.value?.instructors.map(i => i.name).filter(Boolean).join(' - ') ?? ''
)

const rateOpen = ref(false)

// --- Recordings modal
const recordingsOpen = ref(false)
const activeSession = ref<CourseSessionItem | null>(null)

function openRecordings(session: CourseSessionItem) {
  activeSession.value = session
  recordingsOpen.value = true
}

onMounted(() => store.fetchCourse(String(route.params.id)))
</script>

<template>
  <div
    v-if="store.isLoading && !course"
    class="space-y-4"
  >
    <USkeleton class="h-10 w-full max-w-xl rounded-full" />
    <USkeleton class="h-72 w-full rounded-xl" />
    <USkeleton class="h-8 w-2/3" />
  </div>

  <p
    v-else-if="!course"
    class="py-16 text-center text-muted"
  >
    {{ t('courses.no_results') }}
  </p>

  <div
    v-else
    class="space-y-5"
  >
    <div class="flex flex-wrap items-center justify-between gap-3">
      <div class="flex w-fit max-w-full gap-1 overflow-x-auto rounded-full bg-elevated p-1">
        <button
          v-for="item in TABS"
          :key="item.value"
          type="button"
          class="shrink-0 rounded-full px-5 py-2 text-sm font-medium transition"
          :class="tab === item.value
            ? 'bg-default text-default shadow-sm'
            : 'text-muted hover:text-default'"
          @click="tab = item.value"
        >
          {{ item.label }}
        </button>
      </div>

      <UButton
        v-if="hasCourseAction(course, 'course_rate')"
        color="primary"
        variant="soft"
        icon="i-lucide-star"
        @click="rateOpen = true"
      >
        {{ t('courses.leave_rate') }}
      </UButton>
    </div>

    <div
      v-if="tab === 'overview'"
      class="grid grid-cols-1 gap-8 lg:grid-cols-3"
    >
      <div class="space-y-8 lg:col-span-2">
        <div class="relative overflow-hidden rounded-xl">
          <video
            v-if="course.previewMedia"
            :src="course.previewMedia"
            :poster="course.image"
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
            <span
              v-if="course.totalStudentsRatings"
              class="flex items-center gap-1"
            >
              <UIcon
                name="i-lucide-star"
                class="h-4 w-4 text-yellow-400"
              />
              {{ course.totalRatings }}
              <span>({{ course.totalStudentsRatings }} {{ t('courses.reviews') }})</span>
            </span>
            <span class="flex items-center gap-1">
              <UIcon
                name="i-lucide-users"
                class="h-4 w-4"
              />
              {{ course.studentsCount }} {{ t('courses.students_count') }}
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
                name="i-lucide-armchair"
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
              :src="course.instructors[0].profilePicture!"
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
          <h2 class="text-lg font-bold">
            {{ t('courses.what_learn') }}
          </h2>
          <div
            class="prose prose-sm max-w-none break-words"
            v-html="course.whatWeWillLearn"
          />
        </div>

        <div
          v-if="course.description"
          class="space-y-3"
        >
          <h2 class="text-lg font-bold">
            {{ t('courses.course_description') }}
          </h2>
          <div
            class="prose prose-sm max-w-none break-words"
            v-html="course.description"
          />
        </div>

        <div
          v-if="course.totalStudentsRatings"
          class="space-y-4"
        >
          <h2 class="text-lg font-bold">
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
                <div class="flex flex-wrap items-center gap-2">
                  <span class="font-medium">{{ review.name }}</span>
                  <span class="flex items-center gap-0.5 text-xs text-muted">
                    <UIcon
                      name="i-lucide-star"
                      class="h-3 w-3 text-yellow-400"
                    />
                    {{ review.stars }}/{{ review.totalStars }}
                  </span>
                  <span class="text-xs text-muted">{{ review.date }}</span>
                </div>
                <p class="text-sm text-muted">
                  {{ review.details }}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div class="space-y-6 lg:col-span-1">
        <div
          v-if="!course.isSubscribed && course.price"
          class="rounded-xl border border-default bg-default p-5"
        >
          <p class="text-3xl font-bold text-primary">
            {{ course.price }}
          </p>
          <p class="text-xs text-muted">
            {{ t('courses.price_include_tax') }}
          </p>
        </div>

        <CoursesCourseSessionList
          :sessions="course.sessionItems"
          :is-subscribed="course.isSubscribed"
          :allow-access-after-expiry="course.allowAccessAfterExpiry"
          @open-recordings="openRecordings"
        />
      </div>
    </div>

    <CoursesDiscussionRoom
      v-else-if="tab === 'discussion'"
      :course-id="String(route.params.id)"
    />

    <CoursesCourseQuizTable
      v-else-if="tab === 'homework'"
      :course-id="String(route.params.id)"
      quiz-type="homework"
      :redirect-tab="2"
      :title-label="t('quizzes.homework_title')"
      :empty-label="t('quizzes.no_homework')"
    />

    <CoursesCourseQuizTable
      v-else-if="tab === 'assignments'"
      :course-id="String(route.params.id)"
      quiz-type="quiz,final_exam"
      :redirect-tab="3"
      :title-label="t('quizzes.exam_title')"
      :empty-label="t('quizzes.no_exams')"
    />

    <CoursesCourseFileManager
      v-else-if="tab === 'files'"
      :course-id="String(route.params.id)"
    />

    <CoursesRecordedSessionsModal
      v-model="recordingsOpen"
      :session="activeSession"
    />

    <CoursesCourseRateModal
      v-model="rateOpen"
      :course-id="String(route.params.id)"
    />
  </div>
</template>
