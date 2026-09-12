<script setup lang="ts">
import { toCoursePackage } from '~/types/package'
import type { RawCoursePackage } from '~/types/package'

definePageMeta({ layout: 'landing' })

const http = useHttp()
const { locale, t } = useI18n()

const { data: packages, status } = await useAsyncData('packages-list', async () => {
  const res = await http.get<{ data?: { data?: RawCoursePackage[] } }>(
    `${locale.value}/landing-page/packages`
  )
  return (res?.data?.data ?? []).map(toCoursePackage)
})
const isLoading = computed(() => status.value === 'pending')
</script>

<template>
  <UContainer class="py-10">
    <h1 class="mb-6 text-2xl font-bold">
      {{ t('packages.page_title') }}
    </h1>

    <div
      v-if="isLoading"
      class="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4"
    >
      <PackagesPackageCardSkeleton
        v-for="n in 8"
        :key="n"
      />
    </div>

    <div
      v-else-if="packages?.length"
      class="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4"
    >
      <PackagesPackageCard
        v-for="item in packages"
        :key="item.id"
        :package="item"
      />
    </div>

    <p
      v-else
      class="py-16 text-center text-muted"
    >
      {{ t('packages.no_packages') }}
    </p>
  </UContainer>
</template>
