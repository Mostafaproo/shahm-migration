<script setup lang="ts">
// Signed-in user pill (avatar + name + role) with its dropdown — the public
// navbar and the dashboard topbar both show it, so it lives here once.
// Role label comes from `user.<user_type>` (طالب / مدرس / ولي امر).
import { resolveAuthHomePath } from '~/core/auth'

const auth = useAuthStore()
const localePath = useLocalePath()
const { t } = useI18n()

const items = computed(() => [[
  {
    label: t('home.nav.dashboard'),
    icon: 'i-lucide-layout-dashboard',
    to: localePath(resolveAuthHomePath({ userType: auth.userType }))
  },
  {
    label: t('home.nav.logout'),
    icon: 'i-lucide-log-out',
    onSelect: () => auth.logout()
  }
]])
</script>

<template>
  <UDropdownMenu :items="items">
    <button
      type="button"
      class="flex items-center gap-2 rounded-full bg-elevated py-1.5 pe-1.5 ps-4 transition hover:bg-accented"
    >
      <span class="text-end leading-tight">
        <span class="block text-sm font-bold text-primary">{{ auth.fullName }}</span>
        <span
          v-if="auth.userType"
          class="block text-xs text-muted"
        >{{ t(`user.${auth.userType}`) }}</span>
      </span>
      <img
        v-if="auth.user?.profile_picture"
        :src="auth.user.profile_picture"
        alt=""
        class="h-9 w-9 shrink-0 rounded-full object-cover"
      >
      <span
        v-else
        class="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-default"
      >
        <UIcon
          name="i-lucide-user"
          class="h-5 w-5 text-muted"
        />
      </span>
    </button>
  </UDropdownMenu>
</template>
