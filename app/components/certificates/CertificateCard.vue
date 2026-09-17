<script setup lang="ts">
import type { Certificate } from '~/types/certificate'

defineProps<{ certificate: Certificate }>()
</script>

<template>
  <div class="flex flex-col overflow-hidden rounded-2xl border border-default bg-default">
    <!-- Artwork frame -->
    <div class="border-b border-default bg-primary/5 p-4">
      <div class="overflow-hidden rounded-xl bg-white shadow-sm ring-1 ring-black/5">
        <!-- The teal cap is part of the frame, not the image, so a certificate
             that fails to load still reads as a certificate. -->
        <div class="h-1.5 bg-primary" />
        <img
          v-if="certificate.fileUrl"
          :src="certificate.fileUrl"
          :alt="certificate.name"
          class="aspect-[4/3] w-full bg-white object-contain"
          loading="lazy"
        >
        <div
          v-else
          class="flex aspect-[4/3] w-full items-center justify-center"
        >
          <UIcon
            name="i-lucide-award"
            class="h-12 w-12 text-primary/40"
          />
        </div>
      </div>
    </div>

    <div class="space-y-1 p-4">
      <p class="text-xs text-muted">
        {{ $t('certificates.issued_on') }}: {{ certificate.issuedAt || '—' }}
      </p>
      <h3 class="font-bold">
        {{ certificate.name }}
      </h3>
    </div>

    <div class="p-4 pt-0">
      <UButton
        v-if="certificate.fileUrl"
        :to="certificate.fileUrl"
        target="_blank"
        external
        block
        color="primary"
        variant="outline"
        size="lg"
        icon="i-lucide-download"
      >
        {{ $t('certificates.download') }}
      </UButton>
    </div>
  </div>
</template>
