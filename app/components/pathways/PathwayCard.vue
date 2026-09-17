<script setup lang="ts">
import type { Pathway } from '~/types/pathway'

const props = defineProps<{
  pathway: Pathway
  registered: boolean
}>()

const localePath = useLocalePath()

const detailLink = computed(() => localePath(`/student/pathways/${props.pathway.id}`))
const started = computed(() => props.registered && props.pathway.progress > 0)
</script>

<template>
  <NuxtLink
    :to="detailLink"
    class="group flex flex-col overflow-hidden rounded-xl border border-default bg-default shadow-sm transition hover:shadow-md"
  >
    <img
      :src="pathway.image"
      :alt="pathway.name"
      class="h-40 w-full object-cover"
    >

    <div class="flex flex-1 flex-col gap-2 p-4">
      <div
        v-if="!registered && pathway.cost"
        class="flex flex-wrap items-baseline gap-2"
      >
        <span class="font-bold text-primary">
          {{ pathway.cost }} {{ $t('pathways.sar') }}
        </span>
        <span class="text-[11px] text-muted">({{ $t('pathways.tax_included') }})</span>
      </div>

      <h3 class="line-clamp-2 font-semibold group-hover:text-primary">
        {{ pathway.name }}
      </h3>

      <div class="mt-auto pt-3">
        <div
          v-if="started"
          class="space-y-1.5"
        >
          <div class="flex items-center justify-between gap-2 text-xs">
            <span class="font-semibold text-primary">{{ pathway.progress }}%</span>
            <span class="truncate text-muted">{{ pathway.nextCourseText }}</span>
          </div>
          <UProgress
            :model-value="pathway.progress"
            size="sm"
          />
        </div>

        <UButton
          v-else
          block
          size="sm"
          :variant="registered ? 'solid' : 'soft'"
        >
          {{ registered ? $t('pathways.start') : $t('pathways.view_details') }}
        </UButton>
      </div>
    </div>
  </NuxtLink>
</template>
