<script setup lang="ts">
definePageMeta({ layout: 'landing' })

const { t } = useI18n()
const courses = useCoursesStore()
const searchTerm = ref('')

const list = useCrudListPage('courses-list', courses, () => courses.courses, () => courses.fetchList())

function onSearch() {
  list.setSearch(searchTerm.value)
}
</script>

<template>
  <UContainer class="py-10">
    <div class="mb-6 flex flex-wrap items-center justify-between gap-4">
      <h1 class="text-2xl font-bold">
        {{ t('courses.page_title') }}
        <span class="text-base font-normal text-muted">({{ t('courses.results_count', { count: list.data.value?.total ?? 0 }) }})</span>
      </h1>
      <UInput
        v-model="searchTerm"
        icon="i-lucide-search"
        class="w-full sm:w-72"
        :placeholder="t('courses.search_placeholder')"
        @keyup.enter="onSearch"
      />
    </div>

    <div
      v-if="list.isLoading.value"
      class="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4"
    >
      <CoursesCourseCardSkeleton
        v-for="n in list.data.value?.perPage || 8"
        :key="n"
      />
    </div>

    <div
      v-else-if="list.data.value?.rows.length"
      class="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4"
    >
      <CoursesCourseCard
        v-for="course in list.data.value.rows"
        :key="course.id"
        :course="course"
      />
    </div>

    <p
      v-else
      class="py-16 text-center text-muted"
    >
      {{ t('courses.no_results') }}
    </p>

    <SharedDataDisplayAppPagination
      class="mt-8"
      :page="list.data.value?.page ?? 1"
      :total="list.data.value?.total ?? 0"
      :per-page="list.data.value?.perPage || 12"
      :total-pages="list.data.value?.totalPages ?? 0"
      @update:page="list.setPage"
    />
  </UContainer>
</template>
