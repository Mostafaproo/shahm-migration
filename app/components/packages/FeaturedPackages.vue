<script setup lang="ts">
import { toCoursePackage } from '~/types/package'
import type { RawCoursePackage } from '~/types/package'

const http = useHttp()
const tenant = useTenant()
const localePath = useLocalePath()
const { locale } = useI18n()

const isEnabled = computed(() => tenant.features.packages !== false)

const { data: packages, status } = await useAsyncData('featured-packages', async () => {
  if (!isEnabled.value) return []
  const res = await http.get<{ data?: { data?: RawCoursePackage[] } }>(
    `${locale.value}/landing-page/packages`,
    { query: { limit: 4 } }
  )
  return (res?.data?.data ?? []).map(toCoursePackage)
})
const isLoading = computed(() => status.value === 'pending')
</script>

<template>
  <UContainer
    v-if="isEnabled && (isLoading || packages?.length)"
    class="py-12"
  >
    <div class="mb-6 flex items-center justify-between">
      <h2 class="text-2xl font-bold">
        {{ $t('packages.course_packages') }}
      </h2>
      <NuxtLink
        :to="localePath('/packages')"
        class="text-sm font-medium text-primary hover:underline"
      >
        {{ $t('packages.view_all') }}
      </NuxtLink>
    </div>

    <div class="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
      <template v-if="isLoading">
        <PackagesPackageCardSkeleton
          v-for="n in 4"
          :key="n"
        />
      </template>
      <PackagesPackageCard
        v-for="item in packages"
        v-else
        :key="item.id"
        :package="item"
      />
    </div>
  </UContainer>
</template>
