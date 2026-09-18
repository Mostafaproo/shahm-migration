<script setup lang="ts">
import type { PackagesTab } from '~/stores/studentPackages'

definePageMeta({
  layout: 'dashboard', title: 'packages.course_packages',
  middleware: 'role-guard',
  roles: ['student']
})

const store = useStudentPackagesStore()
const route = useRoute()
const router = useRouter()
const { t } = useI18n()

const TABS: { value: PackagesTab, label: string }[] = [
  { value: 'new', label: 'packages.new_packages' },
  { value: 'registered', label: 'packages.registered_packages' }
]

function isTab(value: unknown): value is PackagesTab {
  return value === 'new' || value === 'registered'
}

async function selectTab(next: PackagesTab) {
  await store.setTab(next)
  router.replace({ query: { ...route.query, tab: next } })
}

onMounted(async () => {
  // Legacy seeds the tab from the URL before its first fetch.
  const fromUrl = route.query.tab
  if (isTab(fromUrl)) store.tab = fromUrl

  store.reset()
  await store.fetchList()

  if (!isTab(route.query.tab)) {
    router.replace({ query: { ...route.query, tab: store.tab } })
  }
})
</script>

<template>
  <div class="space-y-5">
    <div class="flex justify-center">
      <div class="flex gap-1 rounded-full bg-elevated p-1">
        <button
          v-for="item in TABS"
          :key="item.value"
          type="button"
          class="rounded-full px-5 py-2 text-sm font-medium transition"
          :class="store.tab === item.value
            ? 'bg-default text-default shadow-sm'
            : 'text-muted hover:text-default'"
          @click="selectTab(item.value)"
        >
          {{ t(item.label) }}
        </button>
      </div>
    </div>

    <div
      v-if="store.isLoading && !store.items.length"
      class="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-4"
    >
      <PackagesPackageCardSkeleton
        v-for="n in 8"
        :key="n"
      />
    </div>

    <template v-else-if="store.items.length">
      <div class="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-4">
        <PackagesPackageCard
          v-for="item in store.items"
          :key="item.id"
          :package="item"
          base-path="/student/packages"
        />
      </div>

      <div
        v-if="store.hasMore"
        class="flex justify-center pt-2"
      >
        <UButton
          variant="soft"
          :loading="store.isLoading"
          @click="store.loadMore()"
        >
          {{ t('packages.load_more') }}
        </UButton>
      </div>
    </template>

    <p
      v-else
      class="py-16 text-center text-muted"
    >
      {{ t('packages.no_packages') }}
    </p>
  </div>
</template>
