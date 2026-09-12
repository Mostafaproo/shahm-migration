<script setup lang="ts" generic="Row extends Record<string, any>">
import type {
  DataTableColumn,
  DataTableStoreLike,
  DefaultActionConfig,
  ResolvedRowAction,
  RowActionOverride,
  RowActionOverrideEntry,
  TableAction,
  TableActionMap
} from '~/utils/dataTable'
import { formatCellValue, resolveCellValue } from '~/utils/dataTable'

const props = withDefaults(defineProps<{
  store: DataTableStoreLike<Row>
  columns: DataTableColumn<Row>[]
  rowActionOverrides?: Record<string, RowActionOverrideEntry<Row>>
  showDefaultActions?: (string | DefaultActionConfig)[]
  searchable?: boolean
}>(), {
  rowActionOverrides: () => ({}),
  showDefaultActions: () => [],
  searchable: true
})

const emit = defineEmits<{
  'default-action': [key: string, action: TableAction]
  'row-action': [action: TableAction, row: Row]
}>()

const INLINE_VERB = /^(view|show|update|edit|delete|remove|destroy)_/

function resolveOverride(key: string): RowActionOverride<Row> | RowActionOverride<Row>[] | undefined {
  return props.rowActionOverrides[key]
}

function defaultInline(key: string): boolean {
  return INLINE_VERB.test(key)
}

/** Every action a row exposes, per §2.5.1: a backend action paired with its override. */
function resolveRowActions(row: Row): ResolvedRowAction<Row>[] {
  const raw = (row as any)?.actions?.data as TableAction[] | undefined
  if (!Array.isArray(raw)) return []

  const resolved: ResolvedRowAction<Row>[] = []
  for (const action of raw) {
    const override = resolveOverride(action.key)
    const overrides = Array.isArray(override) ? override : [override]
    overrides.forEach((o, i) => {
      if (o?.hide) return
      if (o?.when && !o.when(row)) return
      resolved.push({ id: `${action.key}:${i}`, action, override: o })
    })
  }
  return resolved
}

function runAction(action: TableAction, override: RowActionOverride<Row> | undefined, row: Row) {
  emit('row-action', action, row)
  if (override?.onClick) {
    override.onClick(row)
    return
  }
  if (override?.autoExecute === false) return
  props.store.executeMutation(action)
}

const search = ref(props.store.search)
let searchTimer: ReturnType<typeof setTimeout> | undefined
watch(search, (value) => {
  clearTimeout(searchTimer)
  searchTimer = setTimeout(() => props.store.setSearch(value), 300)
})

function toggleSort(key: string) {
  props.store.setSort(key)
}

const toolbarActions = computed(() => {
  const map: TableActionMap = props.store.defaultActions ?? {}
  return props.showDefaultActions
    .map((entry) => {
      const config: DefaultActionConfig = typeof entry === 'string' ? { key: entry } : entry
      const action = map[config.key]
      return action ? { config, action } : null
    })
    .filter((v): v is { config: DefaultActionConfig, action: TableAction } => v !== null)
})

function runDefaultAction({ config, action }: { config: DefaultActionConfig, action: TableAction }) {
  emit('default-action', config.key, action)
  if (config.autoExecute === false) return
  props.store.executeMutation(action)
}
</script>

<template>
  <div class="space-y-3">
    <div
      v-if="props.searchable || toolbarActions.length"
      class="flex items-center justify-between gap-2"
    >
      <UInput
        v-if="props.searchable"
        v-model="search"
        icon="i-lucide-search"
        :placeholder="$t('common.search')"
        class="max-w-xs"
      />
      <div class="flex gap-2">
        <UButton
          v-for="{ config, action } in toolbarActions"
          :key="config.key"
          :icon="config.icon"
          :color="config.color ?? 'primary'"
          :variant="config.color ? 'solid' : 'outline'"
          @click="runDefaultAction({ config, action })"
        >
          {{ action.label ?? config.key }}
        </UButton>
      </div>
    </div>

    <div class="overflow-x-auto rounded-lg border border-default">
      <table class="w-full text-sm">
        <thead>
          <tr class="border-b border-default bg-elevated/50">
            <th
              v-for="col in props.columns"
              :key="col.key"
              class="px-3 py-2 text-start font-medium"
              :class="[col.class, col.sortable && 'cursor-pointer select-none']"
              @click="col.sortable && toggleSort(col.key)"
            >
              <span class="inline-flex items-center gap-1">
                {{ col.label }}
                <UIcon
                  v-if="col.sortable && props.store.sortBy === col.key"
                  :name="props.store.sortOrder === 'asc' ? 'i-lucide-arrow-up' : 'i-lucide-arrow-down'"
                  class="size-3.5"
                />
              </span>
            </th>
            <th class="px-3 py-2 text-end font-medium">
              {{ ' ' }}
            </th>
          </tr>
        </thead>
        <tbody>
          <tr v-if="props.store.isLoading">
            <td
              :colspan="props.columns.length + 1"
              class="px-3 py-6 text-center text-muted"
            >
              {{ $t('common.loading') }}
            </td>
          </tr>
          <tr v-else-if="!props.store.rows.length">
            <td
              :colspan="props.columns.length + 1"
              class="px-3 py-6 text-center text-muted"
            >
              {{ $t('common.noResults') }}
            </td>
          </tr>
          <tr
            v-for="row in props.store.rows"
            v-else
            :key="row.id"
            class="border-b border-default last:border-0"
          >
            <td
              v-for="col in props.columns"
              :key="col.key"
              class="px-3 py-2"
              :class="col.class"
            >
              {{ col.format
                ? col.format(col.accessor ? col.accessor(row) : resolveCellValue(row, col.key), row)
                : formatCellValue(col.accessor ? col.accessor(row) : resolveCellValue(row, col.key), { cellType: col.cellType }) }}
            </td>
            <td class="px-3 py-2">
              <div class="flex items-center justify-end gap-1">
                <template
                  v-for="entry in resolveRowActions(row)"
                  :key="entry.id"
                >
                  <UButton
                    v-if="entry.override?.inline ?? defaultInline(entry.action.key)"
                    :icon="entry.override?.icon ?? 'i-lucide-more-horizontal'"
                    size="xs"
                    :color="(entry.override?.color as any) ?? 'neutral'"
                    variant="ghost"
                    @click="runAction(entry.action, entry.override, row)"
                  >
                    {{ entry.override?.label ?? entry.action.label }}
                  </UButton>
                </template>
                <UDropdownMenu
                  v-if="resolveRowActions(row).some((e) => !(e.override?.inline ?? defaultInline(e.action.key)))"
                  :items="resolveRowActions(row)
                    .filter((e) => !(e.override?.inline ?? defaultInline(e.action.key)))
                    .map((e) => ({
                      label: e.override?.label ?? e.action.label ?? e.action.key,
                      icon: e.override?.icon,
                      onSelect: () => runAction(e.action, e.override, row)
                    }))"
                >
                  <UButton
                    icon="i-lucide-ellipsis-vertical"
                    size="xs"
                    color="neutral"
                    variant="ghost"
                  />
                </UDropdownMenu>
              </div>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <SharedDataDisplayAppPagination
      align="end"
      :page="props.store.page"
      :total="props.store.total"
      :per-page="props.store.perPage ?? 20"
      :total-pages="props.store.totalPages"
      @update:page="props.store.setPage"
    />
  </div>
</template>
