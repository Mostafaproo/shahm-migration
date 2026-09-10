<script setup lang="ts">
type StatusTone = 'success' | 'warning' | 'error' | 'info' | 'neutral'

const props = withDefaults(defineProps<{
  status: string
  toneMap?: Record<string, StatusTone>
}>(), {
  toneMap: () => ({})
})

const DEFAULT_TONES: Record<string, StatusTone> = {
  active: 'success',
  enabled: 'success',
  approved: 'success',
  published: 'success',
  pending: 'warning',
  draft: 'neutral',
  inactive: 'error',
  disabled: 'error',
  rejected: 'error',
  archived: 'neutral'
}

const tone = computed<StatusTone>(() => {
  const key = props.status?.toLowerCase?.() ?? ''
  return props.toneMap[key] ?? DEFAULT_TONES[key] ?? 'neutral'
})
</script>

<template>
  <UBadge
    :color="tone"
    variant="subtle"
  >
    {{ status }}
  </UBadge>
</template>
