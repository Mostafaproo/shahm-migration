<script setup lang="ts">
import { dashboardNav, isNavGroup } from '~/core/auth'
import type { DashboardNavGroup } from '~/core/auth'

const tenant = useTenant()
const auth = useAuthStore()
const localePath = useLocalePath()
const route = useRoute()

const visibleItems = computed(() => dashboardNav(auth.userType, tenant.features))

/** Which groups the user has opened or closed by hand, keyed by label. */
const toggled = ref<Record<string, boolean>>({})

/** A group holding the current page starts open, as in the legacy. */
function holdsCurrentRoute(group: DashboardNavGroup): boolean {
  return group.children.some(child => route.path.includes(child.to))
}

function isOpen(group: DashboardNavGroup): boolean {
  return toggled.value[group.label] ?? holdsCurrentRoute(group)
}

function toggle(group: DashboardNavGroup) {
  toggled.value = { ...toggled.value, [group.label]: !isOpen(group) }
}
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
      <template
        v-for="item in visibleItems"
        :key="item.label"
      >
        <!-- Collapsible group -->
        <div v-if="isNavGroup(item)">
          <button
            type="button"
            class="flex w-full items-center gap-3 rounded-lg px-3 py-3 text-base font-bold text-muted transition hover:bg-elevated hover:text-default"
            :aria-expanded="isOpen(item)"
            @click="toggle(item)"
          >
            <UIcon
              :name="item.icon"
              class="h-6 w-6 shrink-0"
            />
            <span class="flex-1 text-start">{{ $t(item.label) }}</span>
            <UIcon
              name="i-lucide-chevron-down"
              class="h-4 w-4 shrink-0 transition-transform"
              :class="isOpen(item) ? 'rotate-180' : ''"
            />
          </button>

          <div
            v-if="isOpen(item)"
            class="mt-1 space-y-1 border-s border-default ps-3 ms-5"
          >
            <NuxtLink
              v-for="child in item.children"
              :key="child.label + child.to"
              :to="localePath(child.to)"
              class="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-semibold text-muted transition hover:bg-elevated hover:text-default"
              active-class="!bg-primary !text-inverted"
            >
              <UIcon
                :name="child.icon"
                class="h-5 w-5 shrink-0"
              />
              {{ $t(child.label) }}
            </NuxtLink>
          </div>
        </div>

        <!-- Plain link -->
        <NuxtLink
          v-else
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
      </template>
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
