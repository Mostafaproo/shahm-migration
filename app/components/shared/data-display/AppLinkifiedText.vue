<script setup lang="ts">
// Renders user-authored text with bare URLs turned into links, WITHOUT
// `v-html` — see `utils/linkify.ts` for why the legacy approach was dropped.
const props = defineProps<{ text: string }>()

const segments = computed(() => linkifySegments(props.text))
</script>

<template>
  <p class="whitespace-pre-wrap break-words">
    <template
      v-for="(segment, index) in segments"
      :key="index"
    >
      <a
        v-if="segment.href"
        :href="segment.href"
        target="_blank"
        rel="noopener noreferrer"
        class="text-primary underline"
      >{{ segment.text }}</a>
      <template v-else>
        {{ segment.text }}
      </template>
    </template>
  </p>
</template>
