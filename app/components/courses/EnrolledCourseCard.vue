<script setup lang="ts">
import type { EnrolledCourse } from '~/types/studentCourse'

const props = defineProps<{ course: EnrolledCourse }>()

const localePath = useLocalePath()

const instructorNames = computed(() =>
  props.course.instructors.map(i => i.name).filter(Boolean).join(' - ')
)
</script>

<template>
  <div class="flex gap-4 overflow-hidden rounded-xl border border-default bg-default">
    <img
      :src="course.image"
      :alt="course.name"
      class="h-auto w-32 shrink-0 object-cover sm:w-40"
    >

    <div class="flex min-w-0 flex-1 flex-col gap-1 py-4 pe-4">
      <h3 class="truncate font-bold">
        {{ course.name }}
      </h3>
      <p
        v-if="course.description"
        class="truncate text-sm text-muted"
      >
        {{ course.description }}
      </p>
      <p class="text-xs text-muted">
        {{ $t('courses.views_count') }} {{ course.viewsCount }}
      </p>
      <p
        v-if="instructorNames"
        class="text-xs text-muted"
      >
        {{ instructorNames }}
      </p>

      <p class="mt-2 text-xs text-muted">
        {{ course.attendedSessions }}/{{ course.totalSessions }} {{ $t('courses.lessons') }}
      </p>
      <UProgress
        :model-value="course.progress"
        size="sm"
      />

      <UButton
        class="mt-3 self-start"
        size="sm"
        :to="localePath(`/student/courses/${course.id}`)"
      >
        {{ $t('courses.resume') }}
      </UButton>
    </div>
  </div>
</template>
