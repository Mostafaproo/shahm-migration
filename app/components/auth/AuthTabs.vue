<script setup lang="ts">
defineProps<{ active: 'login' | 'register' }>()
const localePath = useLocalePath()
</script>

<template>
  <div class="grid grid-cols-2 gap-1 rounded-full bg-elevated p-1">
    <NuxtLink
      :to="localePath('/auth/login')"
      class="rounded-full py-2.5 text-center text-sm font-semibold transition-colors"
      :class="active === 'login' ? 'bg-primary text-inverted shadow' : 'text-muted hover:text-default'"
    >
      {{ $t('auth.tabs.login') }}
    </NuxtLink>
    <NuxtLink
      :to="localePath('/auth/register')"
      class="rounded-full py-2.5 text-center text-sm font-semibold transition-colors"
      :class="active === 'register' ? 'bg-primary text-inverted shadow' : 'text-muted hover:text-default'"
    >
      {{ $t('auth.tabs.register') }}
    </NuxtLink>
  </div>
</template>
