<script setup lang="ts">
definePageMeta({ layout: 'landing' })

const tenant = useTenant()
const { t } = useI18n()

const policy = computed(() => tenant.privacyPolicy?.trim() ?? '')

useHead({ title: () => t('privacy.page_title') })
</script>

<template>
  <UContainer class="py-10">
    <h1 class="mb-6 text-2xl font-bold">
      {{ t('privacy.page_title') }}
    </h1>

    <div
      v-if="policy"
      class="prose max-w-none [&_*]:!font-[inherit]"
      v-html="policy"
    />

    <p
      v-else
      class="rounded-xl border border-default bg-default py-16 text-center text-muted"
    >
      {{ t('privacy.not_published') }}
    </p>
  </UContainer>
</template>
