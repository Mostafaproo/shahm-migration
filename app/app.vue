<script setup lang="ts">
import { ar, en } from '@nuxt/ui/locale'

const { locale } = useI18n()
const uiLocale = computed(() => locale.value === 'ar' ? ar : en)
const head = useLocaleHead({ lang: true, dir: true, seo: false })

useHead(() => ({
  htmlAttrs: {
    lang: head.value.htmlAttrs?.lang,
    dir: head.value.htmlAttrs?.dir
  }
}))
</script>

<template>
  <UApp
    :locale="uiLocale"
    :toaster="{ position: 'bottom-center' }"
  >
    <NuxtLayout>
      <NuxtPage />
    </NuxtLayout>
  </UApp>
</template>
