<script setup lang="ts">
// Thin, shared wrapper around UPagination — both AppCrudDataTable (admin
// dashboards) and public listing pages (courses, instructors, packages) wire
// the same page/total/perPage/@update:page wherever they show a paginated
// list; this is the one place that logic lives.
//
// `v-model:page="pageProxy"` below is NOT cosmetic — Nuxt UI's
// <UPagination> (Reka UI's PaginationRoot under it) only fires page changes
// when bound via `v-model:page`. The seemingly-equivalent split form,
// `:page="page" @update:page="handler"`, silently never emits with the
// installed @nuxt/ui 4.11.1 / reka-ui 2.10.4 — confirmed directly against an
// isolated page (a plain `:page`/`@update:page` pair never fired; switching
// only that binding to `v-model:page` fixed it, nothing else changed).
// `pageProxy` is how a wrapper forwards a v-model without owning the state.
const props = withDefaults(defineProps<{
  page: number
  total: number
  perPage: number
  totalPages: number
  align?: 'center' | 'end'
}>(), {
  align: 'center'
})

const emit = defineEmits<{ 'update:page': [page: number] }>()

const pageProxy = computed({
  get: () => props.page,
  set: (page: number) => emit('update:page', page)
})
</script>

<template>
  <div
    v-if="totalPages > 1"
    class="flex"
    :class="align === 'end' ? 'justify-end' : 'justify-center'"
  >
    <UPagination
      v-model:page="pageProxy"
      :total="total"
      :items-per-page="perPage"
    />
  </div>
</template>
