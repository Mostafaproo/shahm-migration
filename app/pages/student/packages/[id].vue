<script setup lang="ts">
definePageMeta({
  layout: 'dashboard', title: 'packages.course_packages',
  middleware: 'role-guard',
  roles: ['student']
})

const route = useRoute()
const store = useStudentPackagesStore()
const localePath = useLocalePath()
const { t } = useI18n()

const pkg = computed(() => store.packageDetail)

onMounted(() => store.fetchOne(String(route.params.id)))
</script>

<template>
  <div class="mx-auto max-w-4xl">
    <div
      v-if="store.isLoadingDetail && !pkg"
      class="space-y-4"
    >
      <USkeleton class="h-56 w-full rounded-xl" />
      <USkeleton class="h-8 w-2/3" />
      <USkeleton class="h-4 w-1/3" />
    </div>

    <p
      v-else-if="!pkg"
      class="py-16 text-center text-muted"
    >
      {{ t('packages.no_packages') }}
    </p>

    <div
      v-else
      class="space-y-8"
    >
      <div class="grid grid-cols-1 gap-6 sm:grid-cols-2">
        <div class="space-y-2">
          <img
            :src="pkg.image"
            :alt="pkg.name"
            class="w-full rounded-xl object-cover"
          >
          <p
            v-if="pkg.availableSeats !== null"
            class="text-sm text-muted"
          >
            {{ t('packages.seats') }}: {{ pkg.availableSeats }}
          </p>
        </div>

        <div class="space-y-3">
          <div class="flex flex-wrap items-baseline gap-2">
            <span class="text-2xl font-bold text-primary">
              {{ pkg.price }} {{ t('packages.sar') }}
            </span>
            <span class="text-xs text-muted">({{ t('packages.tax_included') }})</span>
          </div>

          <h1 class="text-2xl font-bold">
            {{ pkg.name }}
          </h1>

          <UBadge
            v-if="pkg.isSubscribed"
            color="success"
            variant="subtle"
          >
            {{ t('packages.subscribed') }}
          </UBadge>

          <div class="flex flex-wrap gap-4 text-sm text-muted">
            <span class="flex items-center gap-1">
              <UIcon
                name="i-lucide-eye"
                class="h-4 w-4"
              />
              {{ pkg.viewsCount }} {{ t('packages.views') }}
            </span>
            <span class="flex items-center gap-1">
              <UIcon
                name="i-lucide-users"
                class="h-4 w-4"
              />
              {{ pkg.subscriptionsCount }} {{ t('packages.number_of_subscription') }}
            </span>
          </div>
        </div>
      </div>

      <div
        v-if="pkg.description"
        class="space-y-2"
      >
        <h2 class="text-lg font-bold">
          {{ t('packages.about_package') }}
        </h2>
        <p class="whitespace-pre-line text-muted">
          {{ pkg.description }}
        </p>
      </div>

      <div class="space-y-3">
        <h2 class="text-lg font-bold">
          {{ t('packages.package_content') }}
        </h2>

        <ul
          v-if="pkg.courses.length"
          class="divide-y divide-default overflow-hidden rounded-xl border border-default bg-default"
        >
          <li
            v-for="course in pkg.courses"
            :key="course.id"
          >
            <NuxtLink
              :to="localePath(`/student/courses/${course.id}`)"
              class="flex items-center justify-between gap-3 p-4 transition hover:bg-elevated"
            >
              <span class="font-medium">{{ course.name }}</span>
              <UIcon
                name="i-lucide-chevron-left"
                class="h-4 w-4 shrink-0 text-muted ltr:rotate-180"
              />
            </NuxtLink>
          </li>
        </ul>

        <p
          v-else
          class="rounded-xl border border-default bg-default p-6 text-center text-muted"
        >
          {{ t('packages.no_courses') }}
        </p>
      </div>
    </div>
  </div>
</template>
