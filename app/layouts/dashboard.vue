<script setup lang="ts">
// Dashboard shell — same structure as the legacy student/instructor/parent
// layouts (sidebar + header + content), one layout for every role since the
// sidebar resolves its own links from the signed-in user's role.
const sidebarOpen = ref(false)
const route = useRoute()

// Close the mobile drawer on navigation.
watch(() => route.fullPath, () => {
  sidebarOpen.value = false
})
</script>

<template>
  <div class="flex h-screen overflow-hidden bg-elevated/40">
    <!-- desktop sidebar -->
    <div class="hidden lg:block">
      <DashboardSidebar />
    </div>

    <!-- mobile drawer -->
    <div
      v-if="sidebarOpen"
      class="fixed inset-0 z-50 lg:hidden"
    >
      <div
        class="absolute inset-0 bg-black/40"
        @click="sidebarOpen = false"
      />
      <div class="absolute inset-y-0 end-0">
        <DashboardSidebar />
      </div>
    </div>

    <div class="flex min-w-0 flex-1 flex-col">
      <DashboardTopbar :on-toggle-sidebar="() => (sidebarOpen = true)" />
      <main class="flex-1 overflow-y-auto p-4 sm:p-6">
        <slot />
      </main>
    </div>
  </div>
</template>
