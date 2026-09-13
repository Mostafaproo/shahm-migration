<script setup lang="ts">
const STATS = [
  { key: 'enrolled', icon: 'i-lucide-book-open', tone: 'text-blue-500 bg-blue-50' },
  { key: 'completed', icon: 'i-lucide-star', tone: 'text-emerald-500 bg-emerald-50' },
  { key: 'hours', icon: 'i-lucide-clock', tone: 'text-amber-500 bg-amber-50' },
  { key: 'certificates', icon: 'i-lucide-users', tone: 'text-purple-500 bg-purple-50' }
] as const
</script>

<template>
  <div class="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
    <div
      v-for="stat in STATS"
      :key="stat.key"
      class="flex items-center justify-between gap-3 rounded-xl border border-default bg-default p-4"
    >
      <span
        class="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl"
        :class="stat.tone"
      >
        <UIcon
          :name="stat.icon"
          class="h-5 w-5"
        />
      </span>
      <span class="text-end">
        <span class="block text-sm text-muted">{{ $t(`courses.stats.${stat.key}`) }}</span>
        <span class="block text-2xl font-bold">—</span>
      </span>
    </div>
  </div>
</template>
