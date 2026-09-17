<script setup lang="ts">
import type { BlankAnswer, HomeworkQuestion, QuestionBlank } from '~/types/homeworkQuestion'

const props = defineProps<{
  question: HomeworkQuestion
  disabled?: boolean
  feedback?: boolean
}>()

const model = defineModel<BlankAnswer[]>({ required: true })

/** The option currently armed by a tap, waiting for a blank to be tapped. */
const armedOptionId = ref<string | null>(null)

const usedOptionIds = computed(() => new Set(model.value.map(a => a.answer_id)))

const availableOptions = computed(() =>
  (props.question.options ?? []).filter(o => !usedOptionIds.value.has(o.id))
)

function optionHtmlFor(blank: QuestionBlank): string {
  const picked = model.value.find(a => a.question_id === blank.id)
  if (!picked) return ''
  return props.question.options?.find(o => o.id === picked.answer_id)?.option ?? ''
}

/** Legacy renders the blank by substituting the marker inside the sub-question. */
function blankHtml(blank: QuestionBlank): string {
  const filled = optionHtmlFor(blank)
  return (blank.question ?? '').replace(
    '*__*',
    filled || '<span class="text-muted">______</span>'
  )
}

/** Review mode is read-only, same as `disabled`. */
const locked = computed(() => Boolean(props.disabled || props.feedback))

/** Legacy marks each blank green/red from its own `is_correct_answer`. */
function blankClass(blank: QuestionBlank): string {
  if (!props.feedback || blank.is_correct_answer == null) return 'border-default'
  return blank.is_correct_answer
    ? 'border-success bg-success/10'
    : 'border-error bg-error/10'
}

function place(blankId: string, optionId: string) {
  if (locked.value || !optionId) return
  // One option per blank, and one blank per option.
  const next = model.value.filter(a => a.question_id !== blankId && a.answer_id !== optionId)
  next.push({ question_id: blankId, answer_id: optionId })
  model.value = next
  armedOptionId.value = null
}

function clearBlank(blankId: string) {
  if (locked.value) return
  model.value = model.value.filter(a => a.question_id !== blankId)
}

function reset() {
  model.value = []
  armedOptionId.value = null
}

// --- native drag & drop
function onDragStart(event: DragEvent, optionId: string) {
  if (locked.value) return
  event.dataTransfer?.setData('text/plain', optionId)
  armedOptionId.value = optionId
}

function onDrop(event: DragEvent, blankId: string) {
  const optionId = event.dataTransfer?.getData('text/plain') || armedOptionId.value
  if (optionId) place(blankId, optionId)
}

// --- tap fallback
function onBlankClick(blank: QuestionBlank) {
  if (locked.value) return
  if (armedOptionId.value) {
    place(blank.id, armedOptionId.value)
    return
  }
  // Tapping a filled blank with nothing armed takes the option back.
  if (model.value.some(a => a.question_id === blank.id)) clearBlank(blank.id)
}
</script>

<template>
  <div class="space-y-5">
    <!-- eslint-disable-next-line vue/no-v-html -- backend-authored description -->
    <div
      v-if="question.description"
      class="prose prose-sm max-w-none font-medium"
      v-html="question.description"
    />

    <!-- Options to drag from -->
    <div class="flex flex-wrap gap-2">
      <button
        v-for="option in availableOptions"
        :key="option.id"
        type="button"
        :draggable="!locked"
        class="cursor-grab rounded-lg border px-3 py-2 text-sm transition active:cursor-grabbing"
        :class="armedOptionId === option.id
          ? 'border-primary bg-primary/10 ring-2 ring-primary/30'
          : 'border-default bg-elevated hover:bg-accented'"
        :disabled="locked"
        @dragstart="onDragStart($event, option.id)"
        @dragend="armedOptionId = null"
        @click="armedOptionId = armedOptionId === option.id ? null : option.id"
      >
        <!-- eslint-disable-next-line vue/no-v-html -- backend-authored option HTML -->
        <span v-html="option.option" />
      </button>

      <p
        v-if="!availableOptions.length"
        class="text-sm text-muted"
      >
        {{ $t('questions.all_placed') }}
      </p>
    </div>

    <!-- Blanks to drop into -->
    <div class="space-y-3">
      <div
        v-for="blank in question.questions ?? []"
        :key="blank.id"
        class="rounded-lg border border-dashed p-3 transition"
        :class="[blankClass(blank), armedOptionId && !locked ? 'border-primary bg-primary/5' : '']"
        @dragover.prevent
        @drop.prevent="onDrop($event, blank.id)"
        @click="onBlankClick(blank)"
      >
        <!-- eslint-disable-next-line vue/no-v-html -- backend-authored blank HTML -->
        <div
          class="prose prose-sm max-w-none"
          v-html="blankHtml(blank)"
        />
        <img
          v-if="blank.media?.url"
          :src="blank.media.url"
          alt=""
          class="mt-2 max-h-48 rounded object-contain"
        >
      </div>
    </div>

    <UButton
      v-if="model.length && !locked"
      color="neutral"
      variant="soft"
      size="sm"
      @click="reset"
    >
      {{ $t('questions.reset') }}
    </UButton>

    <QuestionsQuestionFeedbackNote
      v-if="feedback"
      :question="question"
    />
  </div>
</template>
