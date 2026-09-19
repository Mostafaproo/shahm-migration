<script setup lang="ts">
// The shared look for every plain table in the app: the bordered, rounded,
// horizontally-scrollable shell and a tinted header row that separates the
// column names from the data (the legacy did this with a `#eeeeee` background
// on `thead th`).
//
// Rows stay with the caller via the default slot — each table's cells differ
// too much to be worth abstracting, but the chrome is identical everywhere, so
// this is the one place that decides how a table looks.
//
// For action-driven CRUD grids use `AppCrudDataTable` instead; this is for the
// hand-built tables (quizzes, files, reports).
withDefaults(defineProps<{
  /** Column headings, already localized. An empty string renders a blank cell. */
  headings: string[]
  /**
   * Swaps the rows for placeholders while keeping the header and the shell in
   * place. A skeleton block rendered *instead of* the table makes the whole
   * page jump the moment data lands, and says nothing about what is coming.
   */
  loading?: boolean
  loadingRows?: number
}>(), {
  loading: false,
  loadingRows: 6
})
</script>

<template>
  <div class="overflow-x-auto rounded-xl border border-default bg-default">
    <table class="w-full text-sm">
      <thead class="bg-elevated">
        <tr>
          <th
            v-for="(heading, index) in headings"
            :key="index"
            class="border-b border-default p-4 text-start font-semibold text-default"
          >
            {{ heading }}
          </th>
        </tr>
      </thead>
      <tbody class="divide-y divide-default">
        <template v-if="loading">
          <tr
            v-for="row in loadingRows"
            :key="`skeleton-${row}`"
          >
            <td
              v-for="(heading, index) in headings"
              :key="index"
              class="p-4"
            >
              <USkeleton class="h-4 w-full" />
            </td>
          </tr>
        </template>
        <slot v-else />
      </tbody>
    </table>
  </div>
</template>
