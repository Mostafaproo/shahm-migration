<script setup lang="ts">
import type { CertificateType } from '~/types/certificate'

definePageMeta({
  layout: 'dashboard',
  title: 'certificates.page_title',
  middleware: 'feature-guard',
  feature: 'certificates'
})

const store = useCertificatesStore()
const tenant = useTenant()
const { t } = useI18n()

const pathwaysEnabled = computed(() => Boolean(tenant.features.learning_path))

const typeItems = computed(() => {
  const items = [
    { label: t('certificates.all_types'), value: null as CertificateType | null },
    { label: t('certificates.course'), value: 'course' as CertificateType | null }
  ]
  if (pathwaysEnabled.value) {
    items.push({ label: t('certificates.pathway'), value: 'pathway' as CertificateType | null })
  }
  return items
})

/** The second dropdown's options depend on which type is selected. */
const certifiableItems = computed(() => {
  const source = store.type === 'pathway' ? store.pathways : store.courses
  return [
    { label: t('certificates.all'), value: null as string | null },
    ...source.map(option => ({ label: option.name, value: option.id as string | null }))
  ]
})

const secondFilterLabel = computed(() =>
  store.type === 'pathway' ? t('certificates.pathway') : t('certificates.course')
)

onMounted(() => {
  store.fetchOptions(pathwaysEnabled.value)
  store.fetchList()
})
</script>

<template>
  <div class="space-y-5">
    <div class="flex flex-wrap items-end gap-3 rounded-xl border border-default bg-default p-4">
      <div class="w-full space-y-1.5 sm:w-64">
        <label class="text-sm font-medium text-muted">{{ t('certificates.search_by') }}</label>
        <USelectMenu
          :model-value="store.type"
          :items="typeItems"
          value-key="value"
          class="w-full"
          :placeholder="t('certificates.search_by')"
          @update:model-value="value => store.setType((value as CertificateType | null) ?? null)"
        />
      </div>

      <!-- Only meaningful once a type narrows what we're listing. -->
      <div
        v-if="store.type"
        class="w-full space-y-1.5 sm:w-64"
      >
        <label class="text-sm font-medium text-muted">{{ secondFilterLabel }}</label>
        <USelectMenu
          :model-value="store.certifiableId"
          :items="certifiableItems"
          value-key="value"
          class="w-full"
          :placeholder="secondFilterLabel"
          @update:model-value="value => store.setCertifiable((value as string | null) ?? null)"
        />
      </div>
    </div>

    <div
      v-if="store.isLoading && !store.items.length"
      class="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-3"
    >
      <USkeleton
        v-for="n in 6"
        :key="n"
        class="h-96 w-full rounded-2xl"
      />
    </div>

    <div
      v-else-if="store.items.length"
      class="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-3"
    >
      <CertificatesCertificateCard
        v-for="certificate in store.items"
        :key="certificate.id"
        :certificate="certificate"
      />
    </div>

    <div
      v-else
      class="flex flex-col items-center gap-3 rounded-xl border border-default bg-default py-16"
    >
      <UIcon
        name="i-lucide-award"
        class="h-14 w-14 text-muted"
      />
      <!-- The backend explains WHY it's empty; prefer its wording. -->
      <p class="px-6 text-center text-muted">
        {{ store.emptyMessage || t('certificates.no_certificates') }}
      </p>
    </div>
  </div>
</template>
