<script setup lang="ts">
import type { Course } from '~/types/course'

const props = withDefaults(defineProps<{
  course: Course

  basePath?: string
}>(), { basePath: '/courses' })

const localePath = useLocalePath()

const detailLink = computed(() => localePath(`${props.basePath}/${props.course.id}`))

const instructorNames = computed(() =>
  props.course.instructors.map(i => i.name).filter(Boolean).join(' - ')
)
</script>

<template>
  <NuxtLink
    :to="detailLink"
    class="group flex flex-col overflow-hidden rounded-xl border border-default bg-default shadow-sm transition hover:shadow-md"
  >
    <div class="relative">
      <img
        :src="course.image"
        :alt="course.name"
        class="h-40 w-full object-cover"
      >
      <span class="absolute start-2 top-2 flex items-center gap-1 rounded-full bg-default/90 px-2 py-1 text-xs font-medium shadow-sm">
        <UIcon
          name="i-lucide-star"
          class="h-3.5 w-3.5 text-yellow-400"
        />
        {{ course.ratingStars }}/{{ course.ratingTotalStars }}
      </span>
      <span class="absolute end-2 top-2 flex items-center gap-1 rounded-full bg-default/90 px-2 py-1 text-xs font-medium shadow-sm">
        <UIcon
          name="i-lucide-eye"
          class="h-3.5 w-3.5 text-muted"
        />
        {{ course.viewsCount }}
      </span>
    </div>

    <div class="flex flex-1 flex-col gap-1 p-4">
      <h3 class="line-clamp-2 font-semibold group-hover:text-primary">
        {{ course.name }}
      </h3>
      <p
        v-if="instructorNames"
        class="text-sm text-muted"
      >
        {{ $t('courses.by') }} {{ instructorNames }}
      </p>
      <p
        v-if="course.remainingPlaces"
        class="text-xs text-muted"
      >
        {{ course.remainingPlaces }} {{ $t('courses.remaining_places') }}
      </p>

      <div class="mt-auto flex items-center justify-between border-t border-default pt-3">
        <div v-if="course.price">
          <p class="font-bold text-primary">
            {{ course.price }}
          </p>
          <p class="text-[11px] text-muted">
            {{ $t('courses.price_include_tax') }}
          </p>
        </div>
        <span v-else />
        <UButton
          size="sm"
          variant="soft"
          trailing-icon="i-lucide-arrow-left"
        >
          {{ $t('courses.view') }}
        </UButton>
      </div>
    </div>
  </NuxtLink>
</template>
