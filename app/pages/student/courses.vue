<script setup lang="ts">
import type { CourseFilters } from '~/types/studentCourse'
import type { CoursesTab } from '~/stores/studentCourses'

definePageMeta({ layout: 'dashboard', title: 'dashboard.nav.courses' })

const courses = useStudentCoursesStore()
const { t } = useI18n()

const showFilters = ref(false)

const TABS: { value: CoursesTab, label: string }[] = [
  { value: 'new', label: 'courses.tabs.new' },
  { value: 'enrolled', label: 'courses.tabs.enrolled' }
]

onMounted(() => {
  courses.fetchLookups()
  courses.fetchList()
})

function onSearch(filters: CourseFilters) {
  courses.applyFilters(filters)
}
</script>

<template>
  <div class="space-y-5">
    <CoursesCourseStatCards />

    <div class="flex justify-center">
      <div class="flex gap-1 rounded-full bg-elevated p-1">
        <button
          v-for="item in TABS"
          :key="item.value"
          type="button"
          class="rounded-full px-5 py-2 text-sm font-medium transition"
          :class="courses.tab === item.value
            ? 'bg-default text-default shadow-sm'
            : 'text-muted hover:text-default'"
          @click="courses.setTab(item.value)"
        >
          {{ t(item.label) }}
        </button>
      </div>
    </div>

    <div class="flex justify-end">
      <UButton
        icon="i-lucide-sliders-horizontal"
        :color="showFilters ? 'primary' : 'neutral'"
        :variant="showFilters ? 'solid' : 'outline'"
        @click="showFilters = !showFilters"
      >
        {{ t('courses.filters.toggle') }}
      </UButton>
    </div>

    <CoursesFilterPanel
      v-if="showFilters"
      :model-value="courses.filters"
      :instructors="courses.instructors"
      :price-sorts="courses.priceSorts"
      :rate-sorts="courses.rateSorts"
      :educational-systems="courses.educationalSystems"
      :loading="courses.isLoading"
      @search="onSearch"
      @reset="courses.resetFilters()"
    />

    <div
      v-if="courses.isLoading && !courses.items.length"
      class="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-4"
    >
      <CoursesCourseCardSkeleton
        v-for="n in 8"
        :key="n"
      />
    </div>

    <template v-else-if="courses.items.length">
      <div
        v-if="courses.tab === 'enrolled'"
        class="grid grid-cols-1 gap-5 xl:grid-cols-2"
      >
        <CoursesEnrolledCourseCard
          v-for="course in courses.items"
          :key="course.id"
          :course="course"
        />
      </div>

      <div
        v-else
        class="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-4"
      >
        <CoursesCourseCard
          v-for="course in courses.items"
          :key="course.id"
          :course="course"
        />
      </div>

      <div
        v-if="courses.hasMore"
        class="flex justify-center pt-2"
      >
        <UButton
          variant="soft"
          :loading="courses.isLoading"
          @click="courses.loadMore()"
        >
          {{ t('courses.load_more') }}
        </UButton>
      </div>
    </template>

    <p
      v-else
      class="py-16 text-center text-muted"
    >
      {{ t('courses.no_results') }}
    </p>
  </div>
</template>
