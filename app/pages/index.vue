<script setup lang="ts">
definePageMeta({ layout: 'landing' })
</script>

<template>
  <div>
    <UContainer class="space-y-4 py-16 text-center">
      <h1 class="text-3xl font-bold">
        {{ $t('common.appName') }}
      </h1>
      <p class="text-muted">
        Navbar migrated from shaham-go-fe's pages/index.vue + components/home/Navbar.vue.
        Next up (one section at a time): hero banner, learning pathways,
        and the app-download section.
      </p>
    </UContainer>

    <HomeAssessmentCenter />
    <CoursesFeaturedCourses />
    <PackagesFeaturedPackages />
  </div>
</template>
