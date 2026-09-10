<template>
  <div class="flex min-h-screen flex-col">
    <HomeNavbar />
    <main class="flex-1">
      <slot />
    </main>
    <!-- TODO (Phase 1, next steps): Footer, Whatsapp widget, promo-code banner
         — ported from legacy layouts/landing.vue's <Footer>/<Whatsapp>/<Discounts>. -->
  </div>
</template>
