<script setup lang="ts">
import { toPathway } from '~/types/pathway'
import type { RawPathway } from '~/types/pathway'

definePageMeta({ layout: 'landing' })

const PER_PAGE = 20

const http = useHttp()
const { locale, t } = useI18n()

const page = ref(1)

const { data, status } = await useAsyncData(
  'landing-pathways',
  async () => {
    const res = await http.get<{
      data?: RawPathway[] | { data?: RawPathway[] }
      meta?: { pagination?: { total?: number, total_pages?: number } }
    }>(`${locale.value}/landing-page/learning-paths`, {
      query: { paginate: 1, page: page.value, per_page: PER_PAGE }
    })

    const doc = res?.data
    const rows = Array.isArray(doc) ? doc : (doc?.data ?? [])
    return {
      items: rows.map(toPathway),
      total: res?.meta?.pagination?.total ?? rows.length,
      totalPages: res?.meta?.pagination?.total_pages ?? 1
    }
  },
  // Re-runs on paging; `useAsyncData` keeps server and client in step.
  { watch: [page] }
)

const isLoading = computed(() => status.value === 'pending')
</script>

<template>
  <UContainer class="py-10">
    <div class="mb-6 flex flex-wrap items-center justify-between gap-4">
      <h1 class="text-2xl font-bold">
        {{ t('pathways.page_title') }}
        <span class="text-base font-normal text-muted">
          ({{ t('courses.results_count', { count: data?.total ?? 0 }) }})
        </span>
      </h1>
    </div>

    <div
      v-if="isLoading"
      class="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4"
    >
      <USkeleton
        v-for="n in 8"
        :key="n"
        class="h-72 w-full rounded-xl"
      />
    </div>

    <div
      v-else-if="data?.items.length"
      class="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4"
    >
      <PathwaysPathwayCard
        v-for="item in data.items"
        :key="item.id"
        :pathway="item"
        base-path="/pathways"
      />
    </div>

    <p
      v-else
      class="py-16 text-center text-muted"
    >
      {{ t('pathways.no_pathways') }}
    </p>

    <SharedDataDisplayAppPagination
      class="mt-8"
      :page="page"
      :total="data?.total ?? 0"
      :per-page="PER_PAGE"
      :total-pages="data?.totalPages ?? 0"
      @update:page="value => page = value"
    />
  </UContainer>
</template>
