<script setup lang="ts">
import { EXAM_QUESTION_TYPES, questionTypeKey } from '~/types/instructorExamQuestion'
import type { ExamQuestion } from '~/types/instructorExamQuestion'
import { PER_PAGE_OPTIONS } from '~/utils/pagination'

definePageMeta({
  layout: 'dashboard',
  title: 'instructorExamQuestions.page_title',
  feature: 'computerized_exam',
  middleware: ['feature-guard', 'role-guard'],
  roles: ['instructor']
})

const store = useInstructorExamQuestionsStore()
const localePath = useLocalePath()
const { t } = useI18n()

const perPageItems = PER_PAGE_OPTIONS.map(n => ({ label: String(n), value: n }))

const typeItems = computed(() => [
  { label: t('instructorExamQuestions.all_types'), value: null as string | null },
  ...EXAM_QUESTION_TYPES.map(value => ({
    label: t(`instructorExamQuestions.types.${value}`),
    value: value as string | null
  }))
])

const headings = computed(() => [
  t('instructorExamQuestions.question_title'),
  t('instructorExamQuestions.question_type'),
  t('instructorExamQuestions.options_count'),
  t('instructorExamQuestions.status'),
  t('instructorExamQuestions.created_at'),
  t('instructorExamQuestions.updated_at'),
  t('instructorExamQuestions.actions')
])

/** Unknown types render verbatim, as in the legacy. */
function typeLabel(type: string): string {
  const key = questionTypeKey(type)
  return key ? t(key) : type
}

const pending = ref<ExamQuestion | null>(null)

const confirmText = computed(() => {
  if (!pending.value) return ''
  return pending.value.isActive
    ? t('instructorExamQuestions.confirm_deactivate')
    : t('instructorExamQuestions.confirm_activate')
})

async function confirmToggle() {
  const question = pending.value
  pending.value = null
  if (question) await store.toggleActive(question)
}

onMounted(() => {
  store.fetchSettings()
  store.fetchList(1)
})
</script>

<template>
  <div class="space-y-5">
    <UAlert
      v-if="!store.isFeatureAvailable"
      color="warning"
      variant="soft"
      icon="i-lucide-triangle-alert"
      :title="t('instructorExamQuestions.feature_unavailable')"
    />

    <div class="flex flex-wrap items-center justify-between gap-3">
      <USelectMenu
        :model-value="store.questionType"
        :items="typeItems"
        value-key="value"
        class="w-full sm:w-72"
        :placeholder="t('instructorExamQuestions.question_type')"
        @update:model-value="value => store.setQuestionType((value as string | null) ?? null)"
      />

      <div class="flex flex-wrap items-center gap-3">
        <div class="flex items-center gap-2 text-sm text-muted">
          <span>{{ t('instructorExamQuestions.show') }}</span>
          <USelectMenu
            :model-value="store.perPage"
            :items="perPageItems"
            value-key="value"
            class="w-24"
            @update:model-value="value => store.setPerPage(Number(value))"
          />
          <span>{{ t('instructorExamQuestions.entries') }}</span>
        </div>

        <UButton
          :to="localePath('/instructor/computerized-test/create')"
          icon="i-lucide-plus"
        >
          {{ t('instructorExamQuestions.create_title') }}
        </UButton>
      </div>
    </div>

    <template v-if="store.isLoading || store.items.length">
      <SharedDataDisplayAppTable
        :headings="headings"
        :loading="store.isLoading"
      >
        <tr
          v-for="question in store.items"
          :key="question.id"
        >
          <td class="p-4 font-medium">
            {{ question.title || '—' }}
          </td>
          <td class="p-4 text-muted">
            {{ typeLabel(question.questionType) || '—' }}
          </td>
          <td class="p-4">
            <UBadge
              variant="soft"
              color="info"
            >
              {{ question.optionsCount }}
            </UBadge>
          </td>
          <td class="p-4">
            <UBadge
              variant="soft"
              :color="question.isActive ? 'success' : 'neutral'"
            >
              {{ question.isActive
                ? t('instructorExamQuestions.active')
                : t('instructorExamQuestions.inactive') }}
            </UBadge>
          </td>
          <td class="p-4 text-muted">
            {{ question.createdAt || '—' }}
          </td>
          <td class="p-4 text-muted">
            {{ question.updatedAt || '—' }}
          </td>
          <td class="p-4">
            <div class="flex items-center gap-1">
              <UButton
                :to="localePath(`/instructor/computerized-test/${question.id}`)"
                size="xs"
                variant="soft"
                icon="i-lucide-pencil"
              >
                {{ t('instructorExamQuestions.edit') }}
              </UButton>
              <UButton
                size="xs"
                variant="ghost"
                :color="question.isActive ? 'success' : 'neutral'"
                :icon="question.isActive ? 'i-lucide-toggle-right' : 'i-lucide-toggle-left'"
                :loading="store.togglingId === question.id"
                :aria-label="question.isActive
                  ? t('instructorExamQuestions.deactivate')
                  : t('instructorExamQuestions.activate')"
                @click="pending = question"
              />
            </div>
          </td>
        </tr>
      </SharedDataDisplayAppTable>

      <SharedDataDisplayAppPagination
        :page="store.page"
        :total="store.total"
        :per-page="store.perPage"
        :total-pages="store.totalPages"
        @update:page="store.setPage"
      />
    </template>

    <p
      v-else
      class="rounded-xl border border-default bg-default py-16 text-center text-muted"
    >
      {{ t('instructorExamQuestions.no_questions') }}
    </p>

    <UModal
      :open="Boolean(pending)"
      :title="confirmText"
      @update:open="value => { if (!value) pending = null }"
    >
      <template #footer>
        <div class="flex w-full justify-end gap-2">
          <UButton
            color="neutral"
            variant="ghost"
            @click="pending = null"
          >
            {{ t('instructorExamQuestions.no') }}
          </UButton>
          <UButton @click="confirmToggle">
            {{ t('instructorExamQuestions.yes') }}
          </UButton>
        </div>
      </template>
    </UModal>
  </div>
</template>
