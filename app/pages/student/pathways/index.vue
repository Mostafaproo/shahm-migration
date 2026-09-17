<script setup lang="ts">
import type { PathwaysTab } from '~/stores/pathways'

definePageMeta({
  layout: 'dashboard',
  title: 'pathways.page_title',
  middleware: 'feature-guard',
  feature: 'learning_path'
})

const store = usePathwaysStore()
const route = useRoute()
const router = useRouter()
const { t } = useI18n()

const TABS: { value: PathwaysTab, label: string }[] = [
  { value: 'new', label: 'pathways.tabs.new' },
  { value: 'registered', label: 'pathways.tabs.registered' }
]

function isTab(value: unknown): value is PathwaysTab {
  return value === 'new' || value === 'registered'
}

async function selectTab(next: PathwaysTab) {
  await store.setTab(next)
  router.replace({ query: { ...route.query, tab: next } })
}

onMounted(async () => {
  const fromUrl = route.query.tab
  if (isTab(fromUrl)) store.tab = fromUrl

  store.reset()
  await store.fetchList(1)

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
      class="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-3"
    >
      <USkeleton
        v-for="n in 6"
        :key="n"
        class="h-72 w-full rounded-xl"
      />
    </div>

    <template v-else-if="store.items.length">
      <div class="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-3">
        <PathwaysPathwayCard
          v-for="item in store.items"
          :key="item.id"
          :pathway="item"
          :registered="store.tab === 'registered'"
        />
      </div>

      <SharedDataDisplayAppPagination
        :page="store.page"
        :total="store.total"
        :per-page="20"
        :total-pages="store.totalPages"
        @update:page="store.setPage"
      />
    </template>

    <!-- Legacy nudges an empty "registered" tab toward the catalogue. -->
    <div
      v-else-if="store.tab === 'registered'"
      class="flex flex-col items-center gap-4 rounded-xl border border-default bg-default py-16"
    >
      <UIcon
        name="i-lucide-route"
        class="h-14 w-14 text-muted"
      />
      <p class="text-muted">
        {{ t('pathways.no_registered') }}
      </p>
      <UButton @click="selectTab('new')">
        {{ t('pathways.browse_new') }}
      </UButton>
    </div>

    <p
      v-else
      class="rounded-xl border border-default bg-default py-16 text-center text-muted"
    >
      {{ t('pathways.no_pathways') }}
    </p>
  </div>
</template>
