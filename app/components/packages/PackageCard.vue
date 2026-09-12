<script setup lang="ts">
import type { CoursePackage } from '~/types/package'

defineProps<{ package: CoursePackage }>()

const localePath = useLocalePath()
</script>

<template>
  <NuxtLink
    :to="localePath(`/packages/${package.id}`)"
    class="group flex flex-col overflow-hidden rounded-xl border border-default bg-default shadow-sm transition hover:shadow-md"
  >
    <img
      :src="package.image"
      :alt="package.name"
      class="h-40 w-full object-cover"
    >

    <div class="flex flex-1 flex-col gap-2 p-4">
      <p class="flex flex-wrap items-baseline gap-1">
        <span class="font-bold text-primary">{{ package.price }} {{ $t('packages.sar') }}</span>
        <span class="text-[11px] text-muted">({{ $t('packages.tax_included') }})</span>
      </p>

      <h3 class="line-clamp-2 font-semibold group-hover:text-primary">
        {{ package.name }}
      </h3>

      <div class="flex flex-wrap items-center gap-4 text-xs text-muted">
        <span class="flex items-center gap-1">
          <UIcon
            name="i-lucide-eye"
            class="h-3.5 w-3.5"
          />
          {{ package.viewsCount }} {{ $t('packages.views') }}
        </span>
        <span class="flex items-center gap-1">
          <UIcon
            name="i-lucide-users"
            class="h-3.5 w-3.5"
          />
          {{ package.subscriptionsCount }} {{ $t('packages.number_of_subscription') }}
        </span>
      </div>

      <UButton
        class="mt-auto"
        block
        size="sm"
        variant="soft"
      >
        {{ $t('packages.view_details') }}
      </UButton>
    </div>
  </NuxtLink>
</template>
