<script setup lang="ts">
import { isRetryAttempt, startAction } from '~/types/courseQuiz'
import { useCourseQuizzesStore } from '~/stores/courseQuizzes'
import { PER_PAGE_OPTIONS } from '~/utils/pagination'
import type { CourseQuiz, QuizType } from '~/types/courseQuiz'

const props = defineProps<{
  courseId: string
  quizType: QuizType
  /** Which tab the answer page should return to — legacy `redirectTab`. */
  redirectTab: number
  titleLabel: string
  emptyLabel: string
}>()

const store = useCourseQuizzesStore()
const localePath = useLocalePath()
const { t } = useI18n()

const rows = computed(() => store.items.map(quiz => ({
  quiz,
  action: startAction(quiz)
})))

const perPageItems = PER_PAGE_OPTIONS.map(n => ({ label: String(n), value: n }))

async function onStart(quiz: CourseQuiz) {
  const action = startAction(quiz)
  if (!action) return

  const retry = isRetryAttempt(quiz, action.label)
  // Legacy drops the locally-cached attempt so a retry starts clean.
  if (retry && import.meta.client) {
    localStorage.removeItem(`homework_state_${quiz.id}`)
    localStorage.removeItem(`answered_questions_${quiz.id}`)
  }

  await store.startQuiz(quiz.id)
  await navigateTo(localePath({
    path: `/student/courses/${props.courseId}/answer-homework/${quiz.id}`,
    query: { redirectTab: props.redirectTab, ...(retry && { retry: 'true' }) }
  }))
}

watch(
  () => [props.courseId, props.quizType],
  () => {
    store.reset()
    store.fetchList(props.courseId, props.quizType, 1)
  },
  { immediate: true }
)
</script>

<template>
  <div class="space-y-4">
    <div
      v-if="store.isLoading && !rows.length"
      class="space-y-2"
    >
      <USkeleton
        v-for="n in 5"
        :key="n"
        class="h-12 w-full"
      />
    </div>

    <template v-else-if="rows.length">
      <div class="flex items-center justify-end gap-2 text-sm text-muted">
        <span>{{ t('quizzes.show') }}</span>
        <USelectMenu
          :model-value="store.perPage"
          :items="perPageItems"
          value-key="value"
          class="w-24"
          @update:model-value="value => store.setPerPage(courseId, quizType, Number(value))"
        />
        <span>{{ t('quizzes.entries') }}</span>
      </div>

      <div class="overflow-x-auto rounded-xl border border-default bg-default">
        <table class="w-full text-sm">
          <thead class="border-b border-default text-muted">
            <tr>
              <th class="p-4 text-start font-medium">
                {{ titleLabel }}
              </th>
              <th class="p-4 text-start font-medium">
                {{ t('quizzes.start_date') }}
              </th>
              <th class="p-4 text-start font-medium">
                {{ t('quizzes.end_date') }}
              </th>
              <th class="p-4 text-start font-medium">
                {{ t('quizzes.status') }}
              </th>
              <th class="p-4 text-start font-medium">
                {{ t('quizzes.actions') }}
              </th>
            </tr>
          </thead>
          <tbody class="divide-y divide-default">
            <tr
              v-for="{ quiz, action } in rows"
              :key="quiz.id"
            >
              <td class="p-4 font-medium">
                {{ quiz.title }}
              </td>
              <td class="p-4 text-muted">
                {{ quiz.startAt || '—' }}
              </td>
              <td class="p-4 text-muted">
                {{ quiz.endAt || '—' }}
              </td>
              <td class="p-4">
                <SharedDataDisplayAppStatusBadge
                  v-if="quiz.status"
                  :status="quiz.status"
                />
                <span v-else>—</span>
              </td>
              <td class="p-4">
                <UButton
                  v-if="action"
                  size="xs"
                  variant="soft"
                  :loading="store.startingId === quiz.id"
                  @click="onStart(quiz)"
                >
                  {{ action.label }}
                </UButton>
                <span
                  v-else
                  class="text-muted"
                >—</span>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <SharedDataDisplayAppPagination
        :page="store.page"
        :total="store.total"
        :per-page="store.perPage"
        :total-pages="store.totalPages"
        @update:page="value => store.setPage(courseId, quizType, value)"
      />
    </template>

    <p
      v-else
      class="rounded-xl border border-default bg-default py-16 text-center text-muted"
    >
      {{ emptyLabel }}
    </p>
  </div>
</template>
