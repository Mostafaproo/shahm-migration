<template>
  <div class="min-h-screen">
    <HomeNavbar />
    <div class="flex min-h-[calc(100vh-4rem)] items-center justify-center bg-elevated/50 p-4">
      <div class="w-full max-w-3xl">
        <slot />
      </div>
    </div>
  </div>
</template>
