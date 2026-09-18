<script setup lang="ts">
// Dashboard topbar — page title on the start side; wallet, language,
// notifications and the signed-in user on the end side.
// Pages set their title with `definePageMeta({ title: 'some.i18n.key' })`.
//
// Wallet balance has no endpoint ported yet, so it renders a dash rather
// than a made-up number — see TODO below. The language switcher and the
// notifications link are fully wired.
const route = useRoute()
const auth = useAuthStore()
const notifications = useNotificationsStore()
const localePath = useLocalePath()
const switchLocalePath = useSwitchLocalePath()
const { t, locale, locales } = useI18n()

const title = computed(() => {
  const key = route.meta.title
  return typeof key === 'string' ? t(key) : ''
})

const otherLocale = computed(() =>
  locales.value.find(l => (typeof l === 'string' ? l : l.code) !== locale.value)
)
const otherLocaleCode = computed(() => {
  const l = otherLocale.value
  return typeof l === 'string' ? l : l?.code
})

// TODO: replace with the real balance once the wallet endpoint is ported.
const walletBalance = ref<number | null>(null)

// Client-only: the badge is per-user data behind auth, nothing to SSR.
onMounted(() => notifications.fetchUnreadCount())

defineProps<{ onToggleSidebar?: () => void }>()
</script>

<template>
  <header class="flex h-16 shrink-0 items-center justify-between gap-4 border-b border-default bg-default px-4 sm:px-6">
    <div class="flex items-center gap-3">
      <UButton
        class="lg:hidden"
        color="neutral"
        variant="ghost"
        icon="i-lucide-menu"
        :aria-label="$t('dashboard.open_sidebar')"
        @click="onToggleSidebar?.()"
      />
      <h1 class="text-lg font-bold">
        {{ title }}
      </h1>
    </div>

    <div class="flex items-center gap-2 sm:gap-3">
      <span class="flex items-center gap-1.5 rounded-full bg-primary/10 px-3 py-1.5 text-sm font-medium text-primary">
        <UIcon
          name="i-lucide-wallet"
          class="h-4 w-4"
        />
        {{ walletBalance ?? '—' }} {{ $t('dashboard.currency') }}
      </span>

      <UButton
        v-if="otherLocaleCode"
        color="neutral"
        variant="ghost"
        icon="i-lucide-globe"
        :to="switchLocalePath(otherLocaleCode)"
        :aria-label="$t('dashboard.switch_language')"
      />

      <!-- `size` only grows the dot; the count needs the badge itself sized,
           hence the explicit min-w/h and text size on the chip's base slot. -->
      <UChip
        :text="notifications.unreadCount"
        :show="notifications.unreadCount > 0"
        size="3xl"
        :ui="{ base: 'min-w-6 h-6 px-1.5 text-xs font-bold rounded-full' }"
      >
        <UButton
          color="neutral"
          variant="ghost"
          icon="i-lucide-bell"
          :to="localePath('/notifications')"
          :aria-label="$t('dashboard.notifications')"
        />
      </UChip>

      <SharedLayoutAppUserMenu v-if="auth.isAuthenticated" />
    </div>
  </header>
</template>
