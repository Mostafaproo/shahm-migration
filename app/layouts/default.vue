<script setup lang="ts">
const auth = useAuthStore()
</script>

<template>
  <div>
    <UHeader>
      <template #left>
        <NuxtLink
          to="/"
          class="font-bold text-lg"
        >
          {{ $t('common.appName') }}
        </NuxtLink>
      </template>

      <template #right>
        <UColorModeButton />
        <UButton
          v-if="auth.isAuthenticated"
          color="neutral"
          variant="ghost"
          icon="i-lucide-log-out"
          @click="auth.logout()"
        >
          {{ auth.fullName }}
        </UButton>
      </template>
    </UHeader>

    <UMain>
      <UContainer class="py-8">
        <slot />
      </UContainer>
    </UMain>
  </div>
</template>
