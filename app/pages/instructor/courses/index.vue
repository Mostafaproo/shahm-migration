<script setup lang="ts">
import { startSessionAction } from '~/types/instructorCourse'
import type { InstructorSession } from '~/types/instructorCourse'
import type { CourseSessionItem } from '~/types/studentCourseDetail'

definePageMeta({
  layout: 'dashboard',
  title: 'instructorCourses.page_title',
  middleware: 'role-guard',
  roles: ['instructor']
})

type Tab = 'overview' | 'discussion' | 'files'

const store = useInstructorCoursesStore()
const route = useRoute()
const router = useRouter()
const { t } = useI18n()

const tab = ref<Tab>('overview')
const courseId = computed(() => String(route.query.course_id ?? ''))

const TABS = computed(() => {
  const items: { value: Tab, label: string }[] = [
    { value: 'overview', label: t('instructorCourses.tabs.overview') }
  ]
  if (courseId.value) {
    items.push(
      { value: 'discussion', label: t('instructorCourses.tabs.discussion') },
      { value: 'files', label: t('instructorCourses.tabs.files') }
    )
  }
  return items
})

function selectCourse(id: string) {
  router.replace({ query: { ...route.query, course_id: id } })
}

// --- recordings modal (shared with the student course page)
const recordingsOpen = ref(false)
const activeSession = ref<CourseSessionItem | null>(null)

function openRecordings(session: InstructorSession) {
  activeSession.value = {
    id: session.id,
    content: session.content,
    sessionType: session.sessionType,
    date: session.date,
    startTime: session.startTime,
    endTime: session.endTime,
    isAppendix: false,
    progress: 0,
    attendance: null,
    recordings: session.recordings,
    actions: session.actions
  }
  recordingsOpen.value = true
}

// --- students roster
const studentsOpen = ref(false)

function openStudents() {
  studentsOpen.value = true
  store.fetchStudents(courseId.value)
}

onMounted(() => store.fetchCourses())

watch(courseId, (id) => {
  store.reset()
  if (id) store.fetchSessions(id, 1)
  else tab.value = 'overview'
}, { immediate: true })
</script>

<template>
  <div class="space-y-5">
    <div class="flex justify-center">
      <div class="flex max-w-full gap-1 overflow-x-auto rounded-full bg-elevated p-1">
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
    </div>

    <div class="grid grid-cols-1 gap-6 lg:grid-cols-5">
      <!-- Course picker — present on every tab, like the legacy -->
      <div class="space-y-3 lg:col-span-2">
        <h2 class="text-lg font-bold">
          {{ t('instructorCourses.my_courses') }}
        </h2>

        <div
          v-if="store.isLoadingCourses && !store.courses.length"
          class="space-y-3"
        >
          <USkeleton
            v-for="n in 4"
            :key="n"
            class="h-24 w-full rounded-xl"
          />
        </div>

        <template v-else-if="store.courses.length">
          <button
            v-for="course in store.courses"
            :key="course.id"
            type="button"
            class="flex w-full gap-3 overflow-hidden rounded-xl border bg-default text-start transition"
            :class="course.id === courseId
              ? 'border-primary ring-1 ring-primary'
              : 'border-default hover:bg-elevated'"
            @click="selectCourse(course.id)"
          >
            <img
              v-if="course.image"
              :src="course.image"
              :alt="course.name"
              class="h-auto w-24 shrink-0 object-cover"
            >
            <div class="min-w-0 flex-1 space-y-1 py-3 pe-3">
              <p class="truncate font-bold">
                {{ course.name }}
              </p>
              <p class="flex flex-wrap items-center gap-3 text-xs text-muted">
                <span class="flex items-center gap-1">
                  <UIcon
                    name="i-lucide-layers"
                    class="h-3.5 w-3.5"
                  />
                  {{ course.sessionsCount }} {{ t('instructorCourses.sessions') }}
                </span>
                <span class="flex items-center gap-1">
                  <UIcon
                    name="i-lucide-eye"
                    class="h-3.5 w-3.5"
                  />
                  {{ course.viewsCount }}
                </span>
              </p>
              <p
                v-if="course.startDate"
                class="text-xs text-muted"
              >
                {{ course.startDate }}
              </p>
            </div>
          </button>

          <div
            v-if="store.hasMoreCourses"
            class="flex justify-center pt-1"
          >
            <UButton
              variant="soft"
              size="sm"
              :loading="store.isLoadingCourses"
              @click="store.loadMoreCourses()"
            >
              {{ t('instructorCourses.load_more') }}
            </UButton>
          </div>
        </template>

        <p
          v-else
          class="rounded-xl border border-default bg-default p-6 text-center text-muted"
        >
          {{ t('instructorCourses.no_courses') }}
        </p>
      </div>

      <!-- Right panel -->
      <div class="lg:col-span-3">
        <p
          v-if="!courseId"
          class="rounded-xl border border-default bg-default py-16 text-center text-muted"
        >
          {{ t('instructorCourses.pick_a_course') }}
        </p>

        <!-- Sessions -->
        <div
          v-else-if="tab === 'overview'"
          class="space-y-3"
        >
          <h2 class="text-lg font-bold">
            {{ t('instructorCourses.course_sessions') }}
          </h2>

          <div
            v-if="store.isLoadingSessions && !store.sessions.length"
            class="space-y-2"
          >
            <USkeleton
              v-for="n in 5"
              :key="n"
              class="h-16 w-full rounded-xl"
            />
          </div>

          <template v-else-if="store.sessions.length">
            <div
              v-for="session in store.sessions"
              :key="session.id"
              class="flex items-center justify-between gap-3 rounded-xl border border-default bg-default p-4"
            >
              <div class="min-w-0 space-y-1">
                <p
                  v-if="session.sessionType === 'live_session' && session.date"
                  class="flex items-center gap-1.5 text-xs text-muted"
                >
                  <UIcon
                    name="i-lucide-clock"
                    class="h-3.5 w-3.5"
                  />
                  <span>{{ session.date }}</span>
                  <span>{{ session.startTime }} - {{ session.endTime }}</span>
                </p>
                <p class="truncate font-medium">
                  {{ session.content }}
                </p>
              </div>

              <div class="flex shrink-0 items-center gap-2">
                <UButton
                  v-if="startSessionAction(session)"
                  size="xs"
                  variant="link"
                >
                  {{ startSessionAction(session)?.label }}
                </UButton>

                <UButton
                  v-if="session.recordings.length"
                  color="primary"
                  variant="soft"
                  size="xs"
                  icon="i-lucide-radio"
                  :aria-label="t('courses.recorded_sessions')"
                  @click="openRecordings(session)"
                />
              </div>
            </div>

            <div
              v-if="store.sessionsPage < store.sessionsTotalPages"
              class="flex justify-center pt-1"
            >
              <UButton
                variant="soft"
                size="sm"
                :loading="store.isLoadingSessions"
                @click="store.fetchSessions(courseId, store.sessionsPage + 1)"
              >
                {{ t('instructorCourses.load_more') }}
              </UButton>
            </div>
          </template>

          <p
            v-else
            class="rounded-xl border border-default bg-default p-6 text-center text-muted"
          >
            {{ t('instructorCourses.no_sessions') }}
          </p>
        </div>

        <!-- Discussion -->
        <div
          v-else-if="tab === 'discussion'"
          class="space-y-4"
        >
          <div class="flex justify-end">
            <UButton
              color="neutral"
              variant="outline"
              icon="i-lucide-user-x"
              @click="openStudents"
            >
              {{ t('instructorCourses.manage_students') }}
            </UButton>
          </div>

          <CoursesDiscussionRoom :course-id="courseId" />
        </div>

        <!-- Files -->
        <CoursesCourseFileManager
          v-else
          :course-id="courseId"
          variant="instructor"
        />
      </div>
    </div>

    <CoursesRecordedSessionsModal
      v-model="recordingsOpen"
      :session="activeSession"
    />

    <!-- Roster: mute or unmute a student for this course's discussion room -->
    <UModal
      v-model:open="studentsOpen"
      :title="t('instructorCourses.manage_students')"
    >
      <template #body>
        <div
          v-if="store.isLoadingStudents"
          class="space-y-2"
        >
          <USkeleton
            v-for="n in 4"
            :key="n"
            class="h-12 w-full"
          />
        </div>

        <ul
          v-else-if="store.students.length"
          class="divide-y divide-default"
        >
          <li
            v-for="student in store.students"
            :key="student.id"
            class="flex items-center justify-between gap-3 py-3"
          >
            <div class="flex min-w-0 items-center gap-2">
              <UAvatar
                :src="student.avatar ?? undefined"
                :alt="student.name"
                size="sm"
              />
              <span class="truncate text-sm">{{ student.name }}</span>
            </div>
            <USwitch
              :model-value="student.isActive"
              :disabled="store.togglingStudentId === student.id || !student.toggleUrl"
              @update:model-value="store.toggleStudent(student)"
            />
          </li>
        </ul>

        <p
          v-else
          class="py-10 text-center text-muted"
        >
          {{ t('instructorCourses.no_students') }}
        </p>
      </template>
    </UModal>
  </div>
</template>
