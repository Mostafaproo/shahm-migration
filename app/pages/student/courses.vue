<script setup lang="ts">
// Placeholder for the student's courses page — the sidebar's only link for
// now. Real content comes with the student domain migration.
definePageMeta({ layout: 'dashboard', title: 'dashboard.nav.courses' })
</script>

<template>
  <div class="rounded-xl border border-default bg-default p-6">
    <p class="text-muted">
      {{ $t('dashboard.coming_soon') }}
    </p>
  </div>
</template>
