<script setup lang="ts">
// Notifications — the first dashboard page students and instructors land on
// after signing in (see core/auth/home.ts).
// Row click mirrors the legacy `seen()`: mark unread rows as read, then
// follow the notification's target if it carries one.
import type { AppNotification } from '~/types/notification'

definePageMeta({ layout: 'dashboard', title: 'notifications.page_title' })

const notifications = useNotificationsStore()
const { t } = useI18n()

onMounted(() => {
  notifications.fetchList()
  notifications.fetchUnreadCount()
})

async function onSelect(item: AppNotification) {
  await notifications.markAsRead(item).catch(() => {})

  if (item.meetingType === 'zoom' && item.vcrSessionId) {
    window.open(`/static/qudrat-app-session/${item.vcrSessionId}?type=${item.vcrSessionType ?? ''}`, '_blank')
    return
  }
  if (item.url) window.open(item.url, '_blank')
}
</script>

<template>
  <div class="space-y-3">
    <div
      v-if="notifications.isLoading && !notifications.items.length"
      class="space-y-3"
    >
      <USkeleton
        v-for="n in 5"
        :key="n"
        class="h-20 w-full rounded-xl"
      />
    </div>

    <template v-else-if="notifications.items.length">
      <button
        v-for="item in notifications.items"
        :key="item.id"
        type="button"
        class="flex w-full items-start justify-between gap-4 rounded-xl border border-default p-4 text-start transition hover:border-primary"
        :class="item.isRead ? 'bg-default' : 'bg-primary/5'"
        @click="onSelect(item)"
      >
        <span class="space-y-1">
          <span class="block font-semibold text-primary">{{ item.title }}</span>
          <span class="block text-sm">{{ item.body }}</span>
          <span class="block text-xs text-muted">{{ item.createdAt }}</span>
        </span>

        <UIcon
          v-if="!item.isRead"
          name="i-lucide-eye"
          class="mt-1 h-5 w-5 shrink-0 text-muted"
          :aria-label="t('notifications.mark_as_read')"
        />
      </button>

      <div
        v-if="notifications.hasMore"
        class="flex justify-center pt-2"
      >
        <UButton
          variant="soft"
          :loading="notifications.isLoading"
          @click="notifications.loadMore()"
        >
          {{ t('notifications.load_more') }}
        </UButton>
      </div>
    </template>

    <p
      v-else
      class="py-16 text-center text-muted"
    >
      {{ t('notifications.empty') }}
    </p>
  </div>
</template>
