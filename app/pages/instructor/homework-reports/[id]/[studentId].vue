<script setup lang="ts">
definePageMeta({
  layout: 'dashboard',
  title: 'instructorReports.page_title',
  middleware: 'role-guard',
  roles: ['instructor']
})

const store = useInstructorHomeworkReportsStore()
const route = useRoute()
const localePath = useLocalePath()
const { t } = useI18n()
const { $appToast: toast } = useNuxtApp()

const examId = computed(() => String(route.params.id ?? ''))
const studentId = computed(() => String(route.params.studentId ?? ''))
const studentName = computed(() => String(route.query.student_name ?? ''))

const backLink = computed(() => localePath(`/instructor/homework-reports/${examId.value}`))
const isLast = computed(() => store.activeIndex >= store.totalQuestions - 1)

// The renderer is read-only here but still needs a model, so this is a sink.
const answerSink = ref(null)

function go(index: number) {
  if (index < 0 || index >= store.totalQuestions || store.isLoadingFeedback) return
  store.fetchQuestion(index)
}

async function grade(payload: { answerId: string, score: number }) {
  const message = await store.gradeEssay(examId.value, payload.answerId, payload.score)
  if (message === null) return
  toast.success(message || t('instructorReports.grade_saved'))
}

onMounted(() => {
  store.resetFeedback()
  store.fetchFeedback(examId.value, studentId.value)
})

onBeforeUnmount(() => store.resetFeedback())
</script>

<template>
  <div class="mx-auto max-w-4xl space-y-5">
    <div class="flex flex-wrap items-center justify-between gap-3">
      <UButton
        :to="backLink"
        color="neutral"
        variant="ghost"
        size="sm"
        icon="i-lucide-arrow-right"
        class="ltr:[&_span:first-child]:rotate-180"
      >
        {{ t('instructorReports.back_to_students') }}
      </UButton>

      <p
        v-if="studentName"
        class="font-medium"
      >
        {{ studentName }}
      </p>
    </div>

    <div class="rounded-xl border border-default bg-default p-5 sm:p-6">
      <div
        v-if="store.isLoadingFeedback && !store.question"
        class="space-y-3"
      >
        <USkeleton class="h-6 w-2/3" />
        <USkeleton
          v-for="n in 4"
          :key="n"
          class="h-12 w-full"
        />
      </div>

      <p
        v-else-if="!store.question"
        class="py-16 text-center text-muted"
      >
        {{ t('instructorReports.no_answers') }}
      </p>

      <div
        v-else
        class="space-y-6"
      >
        <p class="text-sm text-muted">
          {{ t('questions.counter', {
            current: store.activeIndex + 1,
            total: store.totalQuestions
          }) }}
        </p>

        <QuestionsQuestionRenderer
          v-model="answerSink"
          :question="store.question"
          feedback
        />

        <QuestionsQuestionEssayGrade
          :question="store.question"
          :saving="store.isSavingGrade"
          @submit="grade"
        />

        <div class="flex flex-wrap items-center justify-between gap-3 border-t border-default pt-4">
          <UButton
            color="neutral"
            variant="outline"
            :disabled="store.activeIndex <= 0 || store.isLoadingFeedback"
            @click="go(store.activeIndex - 1)"
          >
            {{ t('questions.previous') }}
          </UButton>

          <UButton
            v-if="isLast"
            :to="backLink"
          >
            {{ t('questions.finish') }}
          </UButton>
          <UButton
            v-else
            color="neutral"
            variant="outline"
            :disabled="store.isLoadingFeedback"
            @click="go(store.activeIndex + 1)"
          >
            {{ t('questions.next') }}
          </UButton>
        </div>
      </div>
    </div>

    <QuestionsQuestionNavigator
      :links="store.questionLinks"
      :active-index="store.activeIndex"
      :disabled="store.isLoadingFeedback"
      show-legend
      @select="go"
    />
  </div>
</template>
