// @ts-check
import withNuxt from './.nuxt/eslint.config.mjs'

export default withNuxt(
  {
    // The http/auth/CRUD boundary layer duck-types external, dynamic data
    // (JSON:API responses, error bodies, query objects) — `any` there is the
    // honest type, and `no-dynamic-delete` fires on the normal
    // build-a-query-object-then-prune-keys pattern used by useDynamicCrud.
    files: [
      'app/core/**/*.ts',
      'app/composables/**/*.ts',
      'app/stores/**/*.ts',
      'app/utils/dataTable.ts',
      'app/components/shared/**/*.vue'
    ],
    rules: {
      '@typescript-eslint/no-explicit-any': 'off',
      '@typescript-eslint/no-dynamic-delete': 'off'
    }
  }
)
