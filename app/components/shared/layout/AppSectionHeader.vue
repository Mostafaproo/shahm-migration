<script setup lang="ts">
// Heading + "view all" link that every landing section repeats (featured
// courses, packages, pathways next). `to` is a plain internal path — the
// locale prefix is applied here so callers don't each reach for localePath.
defineProps<{
  title: string
  to?: string
  linkLabel?: string
}>()

const localePath = useLocalePath()
</script>

<template>
  <div class="mb-6 flex flex-wrap items-center justify-between gap-3">
    <h2 class="text-2xl font-bold">
      {{ title }}
    </h2>
    <NuxtLink
      v-if="to && linkLabel"
      :to="localePath(to)"
      class="text-base font-bold text-primary hover:underline"
    >
      {{ linkLabel }}
    </NuxtLink>
  </div>
</template>
