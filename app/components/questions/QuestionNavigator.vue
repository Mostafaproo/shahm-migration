<script setup lang="ts">
import type { ReportQuestionLink } from '~/types/homeworkReport'

const props = defineProps<{
  links: ReportQuestionLink[]
  activeIndex: number
  disabled?: boolean
  /** Hidden by default; the instructor screen turns it on. */
  showLegend?: boolean
}>()

const emit = defineEmits<{ select: [number] }>()

const { t } = useI18n()

type State = 'correct' | 'wrong' | 'unanswered'

function stateOf(link: ReportQuestionLink): State {
  if (!link.isAnswered) return 'unanswered'
  return link.isCorrect ? 'correct' : 'wrong'
}

const CHIP: Record<State, string> = {
  correct: 'border-success bg-success/10 text-success',
  wrong: 'border-error bg-error/10 text-error',
  unanswered: 'border-default text-muted hover:bg-elevated'
}

const LEGEND: { state: State, label: string }[] = [
  { state: 'correct', label: 'questions.correct_answer' },
  { state: 'wrong', label: 'questions.wrong_answer' },
  { state: 'unanswered', label: 'questions.not_answered' }
]

function select(index: number) {
  if (props.disabled || index === props.activeIndex) return
  if (index < 0 || index >= props.links.length) return
  emit('select', index)
}
</script>

<template>
  <div
    v-if="links.length > 1"
    class="space-y-3"
  >
    <div class="flex flex-wrap justify-center gap-2">
      <button
        v-for="(link, index) in links"
        :key="link.id"
        type="button"
        class="h-9 w-9 rounded-lg border text-sm font-medium transition"
        :class="[CHIP[stateOf(link)], index === activeIndex ? 'ring-2 ring-primary' : '']"
        :disabled="disabled"
        @click="select(index)"
      >
        {{ index + 1 }}
      </button>
    </div>

    <ul
      v-if="showLegend"
      class="flex flex-wrap justify-center gap-4 text-xs text-muted"
    >
      <li
        v-for="entry in LEGEND"
        :key="entry.state"
        class="flex items-center gap-1.5"
      >
        <span
          class="h-3 w-3 rounded border"
          :class="CHIP[entry.state]"
        />
        {{ t(entry.label) }}
      </li>
    </ul>
  </div>
</template>
