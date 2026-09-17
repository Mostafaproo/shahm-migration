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
defineProps<{
  /** Column headings, already localized. An empty string renders a blank cell. */
  headings: string[]
}>()
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
        <slot />
      </tbody>
    </table>
  </div>
</template>
