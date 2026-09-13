<script setup lang="ts">
import { canShowRecordings } from '~/types/studentCourseDetail'
import type { CourseSessionItem } from '~/types/studentCourseDetail'

const props = defineProps<{
  sessions: CourseSessionItem[]
  isSubscribed: boolean
  allowAccessAfterExpiry: boolean
}>()

const emit = defineEmits<{ openRecordings: [session: CourseSessionItem] }>()

function canOpenRecordings(session: CourseSessionItem): boolean {
  const hasAccess = props.isSubscribed
    || (session.progress > 0 && props.allowAccessAfterExpiry)
  return hasAccess && canShowRecordings(session)
}

function startAction(session: CourseSessionItem) {
  return session.actions.find(a => a.key === 'start_session')
}
</script>

<template>
  <div class="space-y-3">
    <h2 class="text-lg font-bold">
      {{ $t('courses.course_content') }}
    </h2>

    <div
      v-if="sessions.length"
      class="divide-y divide-default overflow-hidden rounded-xl border border-default bg-default"
    >
      <div
        v-for="session in sessions"
        :key="session.id"
        class="flex items-center justify-between gap-3 p-4"
      >
        <div class="min-w-0 space-y-1">
          <p
            v-if="session.sessionType === 'live_session' && session.date"
            class="flex items-center gap-1.5 text-xs text-muted"
          >
            <UIcon
              name="i-lucide-clock"
              class="h-3.5 w-3.5"
            />
            <span>{{ session.date }}</span>
            <span>{{ session.startTime }} - {{ session.endTime }}</span>
          </p>
          <p class="truncate font-medium">
            {{ session.content }}
          </p>
          <UBadge
            v-if="session.attendance"
            size="sm"
            variant="subtle"
          >
            {{ session.attendance }}
          </UBadge>
        </div>

        <div class="flex shrink-0 items-center gap-2">
          <UButton
            v-if="startAction(session)"
            size="xs"
            variant="link"
          >
            {{ startAction(session)?.label }}
          </UButton>

          <UButton
            v-if="canOpenRecordings(session)"
            color="primary"
            variant="soft"
            icon="i-lucide-radio"
            :aria-label="$t('courses.recorded_sessions')"
            @click="emit('openRecordings', session)"
          />
        </div>
      </div>
    </div>

    <p
      v-else
      class="rounded-xl border border-default bg-default p-6 text-center text-muted"
    >
      {{ $t('courses.no_sessions') }}
    </p>
  </div>
</template>
