<script setup lang="ts">
import { resolveAuthHomePath } from '~/core/auth'

const tenant = useTenant()
const auth = useAuthStore()
const localePath = useLocalePath()

const NAV_LINKS = [
  { label: 'home.nav.home', to: '/' },
  { label: 'home.nav.courses', to: '/courses' },
  { label: 'home.nav.pathways', to: '/pathways' },
  { label: 'home.nav.packages', to: '/packages' },
  { label: 'home.nav.contact_us', to: '/contact-us' }
]

const search = ref('')
const mobileOpen = ref(false)

function onSearch() {
  navigateTo(localePath({ path: '/courses', query: search.value ? { search_key: search.value } : {} }))
  mobileOpen.value = false
}
</script>

<template>
  <header class="sticky top-0 z-40 border-b border-default bg-default/95 backdrop-blur">
    <UContainer class="flex h-16 items-center gap-8">
      <NuxtLink
        :to="localePath('/')"
        class="flex shrink-0 items-center gap-2"
      >
        <img
          v-if="tenant.logo"
          :src="tenant.logo"
          alt=""
          class="h-9 w-auto"
        >
        <template v-else>
          <span class="flex h-10 w-10 items-center justify-center rounded-lg bg-primary">
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

      <nav class="hidden items-center gap-8 lg:flex">
        <NuxtLink
          v-for="link in NAV_LINKS"
          :key="link.to"
          :to="localePath(link.to)"
          class="text-sm font-medium text-muted hover:text-primary"
          active-class="text-primary"
        >
          {{ $t(link.label) }}
        </NuxtLink>
      </nav>

      <div class="hidden flex-1 md:block">
        <UInput
          v-model="search"
          icon="i-lucide-search"
          size="lg"
          class="mx-auto w-full max-w-sm"
          :placeholder="$t('home.nav.search_placeholder')"
          @keyup.enter="onSearch"
        />
      </div>

      <div class="ms-auto hidden items-center gap-3 lg:flex">
        <SharedLayoutAppUserMenu v-if="auth.isAuthenticated" />
        <template v-else>
          <UButton
            color="primary"
            variant="outline"
            :to="localePath('/auth/login')"
          >
            {{ $t('home.nav.login') }}
          </UButton>
          <UButton
            color="primary"
            :to="localePath('/auth/register')"
          >
            {{ $t('home.nav.create_account') }}
          </UButton>
        </template>
      </div>

      <UButton
        class="ms-auto lg:hidden"
        color="neutral"
        variant="ghost"
        :icon="mobileOpen ? 'i-lucide-x' : 'i-lucide-menu'"
        :aria-label="mobileOpen ? $t('home.nav.close_menu') : $t('home.nav.open_menu')"
        @click="mobileOpen = !mobileOpen"
      />
    </UContainer>

    <UContainer
      v-if="mobileOpen"
      class="space-y-4 border-t border-default py-4 lg:hidden"
    >
      <UInput
        v-model="search"
        icon="i-lucide-search"
        class="w-full"
        :placeholder="$t('home.nav.search_placeholder')"
        @keyup.enter="onSearch"
      />
      <nav class="flex flex-col gap-3">
        <NuxtLink
          v-for="link in NAV_LINKS"
          :key="link.to"
          :to="localePath(link.to)"
          class="text-sm font-medium text-muted hover:text-primary"
          active-class="text-primary"
          @click="mobileOpen = false"
        >
          {{ $t(link.label) }}
        </NuxtLink>
      </nav>
      <div class="flex flex-col gap-2">
        <template v-if="auth.isAuthenticated">
          <UButton
            color="neutral"
            variant="soft"
            :to="localePath(resolveAuthHomePath({ userType: auth.userType }))"
          >
            {{ $t('home.nav.dashboard') }}
          </UButton>
          <UButton
            color="error"
            variant="soft"
            @click="auth.logout()"
          >
            {{ $t('home.nav.logout') }}
          </UButton>
        </template>
        <template v-else>
          <UButton
            color="primary"
            variant="outline"
            block
            :to="localePath('/auth/login')"
          >
            {{ $t('home.nav.login') }}
          </UButton>
          <UButton
            color="primary"
            block
            :to="localePath('/auth/register')"
          >
            {{ $t('home.nav.create_account') }}
          </UButton>
        </template>
      </div>
    </UContainer>
  </header>
</template>
