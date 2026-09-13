<script setup lang="ts">
// Filter panel for the dashboard courses page — mirrors the legacy
// FilterComponent's inputs: educational system, instructors, price sort,
// rate sort and a free-text search, with Search / Reset actions.
// Options come from the verified `look-up` endpoint; a group with no
// options (e.g. this tenant has no educational systems) renders nothing.
import { emptyCourseFilters } from '~/types/studentCourse'
import type { CourseFilters, LookupOption } from '~/types/studentCourse'

const props = defineProps<{
  modelValue: CourseFilters
  instructors: LookupOption[]
  priceSorts: LookupOption[]
  rateSorts: LookupOption[]
  educationalSystems: LookupOption[]
  loading?: boolean
}>()

const emit = defineEmits<{
  search: [filters: CourseFilters]
  reset: []
}>()

// Edited locally so nothing is applied until "Search" is pressed, matching
// the legacy panel.
const draft = ref<CourseFilters>({ ...props.modelValue })
watch(() => props.modelValue, value => (draft.value = { ...value }))

const instructorItems = computed(() =>
  props.instructors.map(i => ({ label: i.label, value: i.value }))
)

/** Sort groups are single-choice: clicking the active option clears it. */
function toggleSort(group: 'price' | 'rate', value: string) {
  draft.value[group] = draft.value[group] === value ? null : value
}

function toggleSystem(value: string) {
  draft.value.educationalSystemId = draft.value.educationalSystemId === value ? null : value
}

function onReset() {
  draft.value = emptyCourseFilters()
  emit('reset')
}
</script>

<template>
  <div class="space-y-5 rounded-xl border border-default bg-default p-5">
    <div class="grid grid-cols-1 gap-5 lg:grid-cols-2">
      <div class="space-y-4">
        <div
          v-if="educationalSystems.length"
          class="flex flex-wrap items-center gap-2"
        >
          <span class="text-sm font-medium">{{ $t('courses.filters.educational_system') }}</span>
          <UButton
            v-for="system in educationalSystems"
            :key="system.value"
            size="xs"
            :color="draft.educationalSystemId === system.value ? 'primary' : 'neutral'"
            :variant="draft.educationalSystemId === system.value ? 'solid' : 'outline'"
            @click="toggleSystem(system.value)"
          >
            {{ system.label }}
          </UButton>
        </div>

        <div
          v-if="instructorItems.length"
          class="flex flex-wrap items-center gap-2"
        >
          <span class="text-sm font-medium">{{ $t('courses.filters.instructors') }}</span>
          <USelectMenu
            v-model="draft.instructorIds"
            class="w-64"
            multiple
            value-key="value"
            :items="instructorItems"
            :placeholder="$t('courses.filters.search_instructor')"
          />
        </div>
      </div>

      <div class="space-y-4">
        <UInput
          v-model="draft.searchKey"
          icon="i-lucide-search"
          class="w-full sm:w-72"
          :placeholder="$t('courses.filters.search_here')"
          @keyup.enter="emit('search', { ...draft })"
        />

        <div
          v-if="priceSorts.length"
          class="flex flex-wrap items-center gap-2"
        >
          <span class="text-sm font-medium">{{ $t('courses.filters.price') }}</span>
          <UButton
            v-for="option in priceSorts"
            :key="option.value"
            size="xs"
            :color="draft.price === option.value ? 'primary' : 'neutral'"
            :variant="draft.price === option.value ? 'solid' : 'outline'"
            @click="toggleSort('price', option.value)"
          >
            {{ option.label }}
          </UButton>
        </div>

        <div
          v-if="rateSorts.length"
          class="flex flex-wrap items-center gap-2"
        >
          <span class="text-sm font-medium">{{ $t('courses.filters.rate') }}</span>
          <UButton
            v-for="option in rateSorts"
            :key="option.value"
            size="xs"
            :color="draft.rate === option.value ? 'primary' : 'neutral'"
            :variant="draft.rate === option.value ? 'solid' : 'outline'"
            @click="toggleSort('rate', option.value)"
          >
            {{ option.label }}
          </UButton>
        </div>
      </div>
    </div>

    <div class="flex items-center justify-end gap-3 border-t border-default pt-4">
      <UButton
        color="neutral"
        variant="link"
        @click="onReset"
      >
        {{ $t('courses.filters.reset') }}
      </UButton>
      <UButton
        color="neutral"
        :loading="loading"
        @click="emit('search', { ...draft })"
      >
        {{ $t('courses.filters.search') }}
      </UButton>
    </div>
  </div>
</template>
