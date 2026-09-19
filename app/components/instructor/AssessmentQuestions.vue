<script setup lang="ts">
import { assessmentConfig, kindKey } from '~/types/assessmentKind'
import type { AssessmentKind } from '~/types/assessmentKind'

import { BUILDER_QUESTION_TYPES, hasAction } from '~/types/instructorAssessment'
import type { AssessmentQuestionRow } from '~/types/instructorAssessment'

const props = defineProps<{ kind: AssessmentKind }>()

const config = computed(() => assessmentConfig(props.kind))

const store = useInstructorAssessmentsStore()
const route = useRoute()
const localePath = useLocalePath()
const { t } = useI18n()
const { $appToast: toast } = useNuxtApp()

const courseId = computed(() => String(route.params.id ?? ''))
const assessmentId = computed(() => String(route.params.assessmentId ?? ''))
const backToForm = computed(() =>
  localePath(`${config.value.authoringPath}/${courseId.value}/${assessmentId.value}`))

/** Only one editor is on screen at a time, as in the legacy. */
type Editor
  = | { mode: 'add', questionType: string }
    | { mode: 'edit', row: AssessmentQuestionRow }
    | { mode: 'preview' }
    | null

const editor = ref<Editor>(null)

const typeItems = computed(() => BUILDER_QUESTION_TYPES.map(type => ({
  label: t(`instructorAssessments.question_types.${type}`),
  onSelect: () => openAdd(type)
})))

function guard(action: string): boolean {
  if (hasAction(store.current, action)) return true
  toast.warning(t('instructorAssessments.action_not_allowed'))
  return false
}

function openAdd(questionType: string) {
  if (!guard('add_question')) return
  editor.value = { mode: 'add', questionType }
}

function openEdit(row: AssessmentQuestionRow) {
  if (!guard('edit_homework')) return
  editor.value = { mode: 'edit', row }
}

// --- delete confirmation
const pendingDelete = ref<AssessmentQuestionRow | null>(null)

function askDelete(row: AssessmentQuestionRow) {
  if (!guard('delete_homework')) return
  pendingDelete.value = row
}

async function confirmDelete() {
  const row = pendingDelete.value
  pendingDelete.value = null
  if (row) await store.removeQuestion(assessmentId.value, row.id)
}

// --- publish
const askPublish = ref(false)

async function confirmPublish() {
  askPublish.value = false
  if (!await store.publish(assessmentId.value)) return
  await navigateTo(localePath({
    path: config.value.authoringPath,
    query: { course_id: courseId.value }
  }))
}

function onSaved(kind: 'created' | 'edited') {
  toast.success(t(kind === 'created'
    ? 'instructorAssessments.question_created'
    : 'instructorAssessments.question_edited'))
  editor.value = null
  store.fetchQuestions(assessmentId.value)
}

function onFailed(details: string[]) {
  details.forEach(detail => toast.warning(detail))
}

onMounted(async () => {
  // The stores are singletons; each screen declares which kind it drives.
  store.kind = props.kind
  store.resetOne()
  await store.fetchOne(assessmentId.value)
  await store.fetchQuestions(assessmentId.value)
})
</script>

<template>
  <div class="mx-auto max-w-4xl space-y-5">
    <div class="flex flex-wrap items-center justify-between gap-3">
      <UButton
        :to="backToForm"
        color="neutral"
        variant="ghost"
        icon="i-lucide-arrow-right"
        class="ltr:[&_span:first-child]:rotate-180"
      >
        {{ t('instructorAssessments.back_to_form') }}
      </UButton>

      <div
        v-if="store.current"
        class="flex flex-wrap items-center gap-2"
      >
        <UButton
          color="neutral"
          variant="outline"
          icon="i-lucide-eye"
          @click="editor = { mode: 'preview' }"
        >
          {{ t('instructorAssessments.view_as_student') }}
        </UButton>

        <UButton
          :color="store.current.isPublished ? 'warning' : 'primary'"
          :icon="store.current.isPublished ? 'i-lucide-undo-2' : 'i-lucide-send'"
          :loading="store.isBusy(`publish:${assessmentId}`)"
          @click="askPublish = true"
        >
          {{ store.current.isPublished
            ? t('instructorAssessments.unpublish')
            : t('instructorAssessments.publish') }}
        </UButton>
      </div>
    </div>

    <!-- The exam being built -->
    <div
      v-if="store.isLoadingOne"
      class="space-y-2 rounded-xl border border-default bg-default p-5"
    >
      <USkeleton class="h-6 w-1/2" />
      <USkeleton class="h-4 w-3/4" />
    </div>

    <div
      v-else-if="store.current"
      class="flex items-start justify-between gap-3 rounded-xl border border-default bg-elevated p-5"
    >
      <div class="min-w-0 space-y-1">
        <h1 class="text-lg font-bold">
          {{ store.current.title }}
        </h1>
        <p class="text-sm text-muted">
          {{ t('instructorAssessments.questions_info') }}
        </p>
      </div>
      <UButton
        :to="backToForm"
        color="neutral"
        variant="ghost"
        size="xs"
        icon="i-lucide-pencil"
        :aria-label="t(kindKey(kind, 'edit'))"
      />
    </div>

    <!-- Preview. The legacy has no way to dismiss this — it only disappears
         once you start adding or editing a question. -->
    <div
      v-if="editor?.mode === 'preview'"
      class="space-y-2"
    >
      <div class="flex justify-end">
        <UButton
          color="neutral"
          variant="ghost"
          size="xs"
          icon="i-lucide-x"
          @click="editor = null"
        >
          {{ t('instructorAssessments.close_preview') }}
        </UButton>
      </div>
      <InstructorQuestionsAppFrame
        operation="view_as_student"
        :assessment-id="assessmentId"
        @saved="onSaved"
        @failed="onFailed"
      />
    </div>

    <!-- The questions -->
    <div
      v-if="store.isLoadingQuestions"
      class="space-y-2"
    >
      <USkeleton
        v-for="n in 3"
        :key="n"
        class="h-16 w-full rounded-xl"
      />
    </div>

    <div
      v-else-if="store.questions.length"
      class="space-y-2"
    >
      <template
        v-for="row in store.questions"
        :key="row.id"
      >
        <div class="flex items-center justify-between gap-3 rounded-xl border border-default bg-default p-4">
          <!-- eslint-disable-next-line vue/no-v-html -- backend-authored question text -->
          <div
            class="prose prose-sm min-w-0 max-w-none flex-1"
            v-html="row.description"
          />

          <div class="flex shrink-0 items-center gap-1">
            <UButton
              size="xs"
              variant="ghost"
              icon="i-lucide-pencil"
              :aria-label="t('instructorAssessments.edit_question')"
              @click="openEdit(row)"
            />
            <UButton
              size="xs"
              variant="ghost"
              color="error"
              icon="i-lucide-trash-2"
              :loading="store.isBusy(`question:${row.id}`)"
              :aria-label="t('instructorAssessments.remove_question')"
              @click="askDelete(row)"
            />
          </div>
        </div>

        <InstructorQuestionsAppFrame
          v-if="editor?.mode === 'edit' && editor.row.id === row.id"
          operation="edit"
          :assessment-id="assessmentId"
          :question="editor.row"
          @saved="onSaved"
          @failed="onFailed"
        />
      </template>
    </div>

    <p
      v-else
      class="rounded-xl border border-default bg-default py-12 text-center text-muted"
    >
      {{ t('instructorAssessments.no_questions') }}
    </p>

    <!-- Add -->
    <InstructorQuestionsAppFrame
      v-if="editor?.mode === 'add'"
      operation="add"
      :assessment-id="assessmentId"
      :question-type="editor.questionType"
      @saved="onSaved"
      @failed="onFailed"
    />

    <div
      v-else
      class="flex justify-center"
    >
      <UDropdownMenu :items="typeItems">
        <UButton
          icon="i-lucide-plus"
          size="lg"
        >
          {{ t('instructorAssessments.add_question') }}
        </UButton>
      </UDropdownMenu>
    </div>

    <!-- Confirmations -->
    <UModal
      :open="Boolean(pendingDelete)"
      :title="t('instructorAssessments.confirm_delete_question')"
      @update:open="value => { if (!value) pendingDelete = null }"
    >
      <template #footer>
        <div class="flex w-full justify-end gap-2">
          <UButton
            color="neutral"
            variant="ghost"
            @click="pendingDelete = null"
          >
            {{ t('instructorAssessments.no') }}
          </UButton>
          <UButton
            color="error"
            @click="confirmDelete"
          >
            {{ t('instructorAssessments.yes') }}
          </UButton>
        </div>
      </template>
    </UModal>

    <UModal
      v-model:open="askPublish"
      :title="store.current?.isPublished
        ? t(kindKey(kind, 'confirm_unpublish'))
        : t(kindKey(kind, 'confirm_publish'))"
    >
      <template #footer>
        <div class="flex w-full justify-end gap-2">
          <UButton
            color="neutral"
            variant="ghost"
            @click="askPublish = false"
          >
            {{ t('instructorAssessments.no') }}
          </UButton>
          <UButton @click="confirmPublish">
            {{ t('instructorAssessments.yes') }}
          </UButton>
        </div>
      </template>
    </UModal>
  </div>
</template>
