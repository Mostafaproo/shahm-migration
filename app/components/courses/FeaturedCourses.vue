<script setup lang="ts">
import { toCourse } from '~/types/course'
import type { RawCourse } from '~/types/course'

const http = useHttp()
const { locale } = useI18n()

const { data: courses, status } = await useAsyncData('featured-courses', async () => {
  // The http client's `data` is the whole deserialized JSON:API document
  // (flattened resources, still shaped `{ data: [...], included: [...] }`)
  // — same double-nesting `useDynamicCrud.fetchList` unwraps.
  const res = await http.get<{ data?: { data?: RawCourse[] } }>(`${locale.value}/landing-page/courses`, {
    query: { limit: 8, active: 1 }
  })
  return (res?.data?.data ?? []).map(toCourse)
})
const isLoading = computed(() => status.value === 'pending')
</script>

<template>
  <UContainer
    v-if="isLoading || courses?.length"
    class="py-12"
  >
    <SharedLayoutAppSectionHeader
      :title="$t('courses.featured_title')"
      to="/courses"
      :link-label="$t('courses.view_all')"
    />

    <div class="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
      <template v-if="isLoading">
        <CoursesCourseCardSkeleton
          v-for="n in 4"
          :key="n"
        />
      </template>
      <CoursesCourseCard
        v-for="course in courses"
        v-else
        :key="course.id"
        :course="course"
      />
    </div>
  </UContainer>
</template>
