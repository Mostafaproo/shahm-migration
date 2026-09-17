<script setup lang="ts">
import type {
  AnswerValue,
  BlankAnswer,
  HomeworkQuestion,
  TrueFalseWithCorrectAnswer
} from '~/types/homeworkQuestion'

defineProps<{
  question: HomeworkQuestion
  disabled?: boolean
  feedback?: boolean
}>()

const model = defineModel<AnswerValue | TrueFalseWithCorrectAnswer>({ required: true })

const choiceModel = computed({
  get: () => model.value as string | string[] | null,
  set: (v: string | string[] | null) => { model.value = v }
})
const boolModel = computed({
  get: () => model.value as boolean | null,
  set: (v: boolean | null) => { model.value = v }
})
const textModel = computed({
  get: () => model.value as string | null,
  set: (v: string | null) => { model.value = v }
})
const tfcModel = computed({
  get: () => (model.value ?? { value: null, optionId: null }) as TrueFalseWithCorrectAnswer,
  set: (v: TrueFalseWithCorrectAnswer) => { model.value = v }
})
const blanksModel = computed({
  get: () => (Array.isArray(model.value) ? model.value : []) as BlankAnswer[],
  set: (v: BlankAnswer[]) => { model.value = v }
})
</script>

<template>
  <QuestionsQuestionChoice
    v-if="question.question_type === 'single_choice' || question.question_type === 'multiple_choice'"
    v-model="choiceModel"
    :question="question"
    :multiple="question.question_type === 'multiple_choice'"
    :disabled="disabled"
    :feedback="feedback"
  />

  <QuestionsQuestionTrueFalse
    v-else-if="question.question_type === 'true_false'"
    v-model="boolModel"
    :question="question"
    :disabled="disabled"
    :feedback="feedback"
  />

  <QuestionsQuestionTrueFalseWithCorrect
    v-else-if="question.question_type === 'true_false_with_correct'"
    v-model="tfcModel"
    :question="question"
    :disabled="disabled"
    :feedback="feedback"
  />

  <QuestionsQuestionEssay
    v-else-if="question.question_type === 'essay'"
    v-model="textModel"
    :question="question"
    :disabled="disabled"
    :feedback="feedback"
  />

  <QuestionsQuestionComplete
    v-else-if="question.question_type === 'complete'"
    v-model="textModel"
    :question="question"
    :disabled="disabled"
    :feedback="feedback"
  />

  <QuestionsQuestionDragDrop
    v-else-if="question.question_type === 'drag_drop_text' || question.question_type === 'drag_drop_image'"
    v-model="blanksModel"
    :question="question"
    :disabled="disabled"
    :feedback="feedback"
  />

  <UAlert
    v-else
    color="warning"
    variant="subtle"
    icon="i-lucide-triangle-alert"
    :description="$t('questions.unsupported_type', { type: question.question_type })"
  />
</template>
