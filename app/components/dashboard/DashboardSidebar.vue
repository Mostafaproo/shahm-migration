<script setup lang="ts">
import { dashboardNav } from '~/core/auth'

const tenant = useTenant()
const auth = useAuthStore()
const localePath = useLocalePath()

const visibleItems = computed(() => dashboardNav(auth.userType, tenant.features))
</script>

<template>
  <aside class="flex h-full w-64 shrink-0 flex-col border-s border-default bg-default">
    <!-- h-16 matches the topbar so both bottom borders line up across the shell -->
    <NuxtLink
      :to="localePath('/')"
      class="flex h-16 shrink-0 items-center gap-2 border-b border-default px-5"
    >
      <img
        v-if="tenant.logo"
        :src="tenant.logo"
        alt=""
        class="h-9 w-auto"
      >
      <template v-else>
        <span class="flex h-10 w-10 items-center justify-center rounded-full bg-primary">
          <UIcon
            name="i-lucide-graduation-cap"
            class="h-6 w-6 text-inverted"
          />
        </span>
        <span class="text-lg font-bold leading-tight">
          {{ tenant.theme.title || $t('common.appName') }}
        </span>
      </template>
    </NuxtLink>

    <nav class="flex-1 space-y-2 overflow-y-auto px-3 py-4">
      <NuxtLink
        v-for="item in visibleItems"
        :key="item.label"
        :to="localePath(item.to)"
        class="flex items-center gap-3 rounded-lg px-3 py-3 text-base font-bold text-muted transition hover:bg-elevated hover:text-default"
        active-class="!bg-primary !text-inverted"
      >
        <UIcon
          :name="item.icon"
          class="h-6 w-6 shrink-0"
        />
        {{ $t(item.label) }}
      </NuxtLink>
    </nav>

    <button
      type="button"
      class="flex items-center gap-3 border-t border-default px-6 py-4 text-sm font-medium text-muted transition hover:text-default"
      @click="auth.logout()"
    >
      <UIcon
        name="i-lucide-log-out"
        class="h-5 w-5 shrink-0"
      />
      {{ $t('dashboard.logout') }}
    </button>
  </aside>
</template>
