<script setup lang="ts">
import { toCoursePackageDetail } from '~/types/package'
import type { RawCoursePackageDetail } from '~/types/package'

definePageMeta({ layout: 'landing' })

const route = useRoute()
const http = useHttp()
const { locale, t } = useI18n()

const { data: coursePackage, status } = await useAsyncData(`package-${route.params.id}`, async () => {
  const res = await http.get<{ data?: RawCoursePackageDetail }>(
    `${locale.value}/landing-page/packages/${route.params.id}`
  )
  return res?.data ? toCoursePackageDetail(res.data) : null
})
const isLoading = computed(() => status.value === 'pending')
</script>

<template>
  <UContainer class="py-10">
    <div
      v-if="isLoading"
      class="space-y-4"
    >
      <USkeleton class="h-64 w-full rounded-xl" />
      <USkeleton class="h-8 w-2/3" />
      <USkeleton class="h-4 w-1/3" />
    </div>

    <p
      v-else-if="!coursePackage"
      class="py-16 text-center text-muted"
    >
      {{ t('packages.no_packages') }}
    </p>

    <div
      v-else
      class="space-y-8"
    >
      <div class="grid grid-cols-1 gap-6 md:grid-cols-2">
        <img
          :src="coursePackage.image"
          :alt="coursePackage.name"
          class="h-64 w-full rounded-xl object-cover"
        >

        <div class="space-y-3">
          <p class="flex flex-wrap items-baseline gap-2">
            <span class="text-3xl font-bold text-primary">{{ coursePackage.price }} {{ t('packages.sar') }}</span>
            <span class="text-xs text-muted">({{ t('packages.tax_included') }})</span>
          </p>

          <h1 class="text-2xl font-bold">
            {{ coursePackage.name }}
          </h1>

          <div class="flex flex-wrap items-center gap-4 text-sm text-muted">
            <span class="flex items-center gap-1">
              <UIcon
                name="i-lucide-eye"
                class="h-4 w-4"
              />
              {{ coursePackage.viewsCount }} {{ t('packages.views') }}
            </span>
            <span class="flex items-center gap-1">
              <UIcon
                name="i-lucide-users"
                class="h-4 w-4"
              />
              {{ coursePackage.subscriptionsCount }} {{ t('packages.number_of_subscription') }}
            </span>
            <span
              v-if="coursePackage.availableSeats !== null"
              class="flex items-center gap-1"
            >
              <UIcon
                name="i-lucide-armchair"
                class="h-4 w-4"
              />
              {{ t('packages.seats') }}: {{ coursePackage.availableSeats }}
            </span>
          </div>
        </div>
      </div>

      <div
        v-if="coursePackage.description"
        class="space-y-3"
      >
        <h2 class="text-lg font-semibold">
          {{ t('packages.about_package') }}
        </h2>
        <p class="text-muted">
          {{ coursePackage.description }}
        </p>
      </div>

      <div
        v-if="coursePackage.courses.length"
        class="space-y-3"
      >
        <h2 class="text-lg font-semibold">
          {{ t('packages.package_content') }}
        </h2>
        <div class="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
          <CoursesCourseCard
            v-for="course in coursePackage.courses"
            :key="course.id"
            :course="course"
          />
        </div>
      </div>
    </div>
  </UContainer>
</template>
