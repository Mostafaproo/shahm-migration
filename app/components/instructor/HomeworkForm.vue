<script setup lang="ts">

import { useHomeworkFormSchema } from '~/schemas/instructor/homework-form-schema'
import type { HomeworkFormInput } from '~/schemas/instructor/homework-form-schema'

const props = defineProps<{
  /** Absent when creating. */
  homeworkId?: string
}>()

const store = useInstructorHomeworksStore()
const coursesStore = useInstructorCoursesStore()
const tenant = useTenant()
const localePath = useLocalePath()
const { t } = useI18n()

const isEdit = computed(() => Boolean(props.homeworkId))
const schema = computed(() => useHomeworkFormSchema(t))

const state = reactive<HomeworkFormInput>({
  title: '',
  course_id: '',
  start_at: '',
  end_at: '',
  quiz_type: 'quiz',
  random_question: false
})

const courseItems = computed(() =>
  coursesStore.courses.map(c => ({ label: c.name, value: c.id })))

/** The legacy offers these two on the exam route; `homework` is a separate module. */
const typeItems = computed(() => [
  { label: t('instructorHomeworks.types.quiz'), value: 'quiz' },
  { label: t('instructorHomeworks.types.final_exam'), value: 'final_exam' }
])

/** Legacy gates the type picker behind the `certificates` feature. */
const showTypePicker = computed(() => Boolean(tenant.features.certificates))

/** Once published, the start date is fixed — students may already have begun. */
const lockStart = computed(() => Boolean(store.current?.isPublished))

async function onSubmit() {
  const payload = {
    title: state.title,
    // The inputs hold `YYYY-MM-DDTHH:mm`; this API only accepts
    // `YYYY-MM-DD HH:mm:ss`.
    start_at: toDateTimeApi(state.start_at),
    end_at: toDateTimeApi(state.end_at),
    quiz_type: state.quiz_type,
    random_question: state.random_question
  }

  const id = isEdit.value
    ? (await store.update(state.course_id, props.homeworkId!, payload) ? props.homeworkId! : null)
    : await store.create(state.course_id, payload)

  if (!id) return
  await navigateTo(localePath(`/instructor/homeworks/${state.course_id}/${id}/questions`))
}

onMounted(async () => {
  if (!coursesStore.courses.length) await coursesStore.fetchCourses()
  if (!props.homeworkId) return

  await store.fetchOne(props.homeworkId)
  const row = store.current
  if (!row) return
  Object.assign(state, {
    title: row.title,
    course_id: row.courseId,
    start_at: toDateTimeInput(row.startAt),
    end_at: toDateTimeInput(row.endAt),
    quiz_type: row.quizType || 'quiz',
    random_question: row.randomQuestion
  })
})
</script>

<template>
  <div class="mx-auto max-w-3xl space-y-5">
    <div class="space-y-1">
      <h1 class="text-xl font-bold">
        {{ isEdit ? t('instructorHomeworks.edit_title') : t('instructorHomeworks.create_title') }}
      </h1>
      <p class="text-sm text-muted">
        {{ t('instructorHomeworks.create_info') }}
      </p>
    </div>

    <div
      v-if="store.isLoadingOne"
      class="space-y-4 rounded-xl border border-default bg-default p-6"
    >
      <USkeleton
        v-for="n in 5"
        :key="n"
        class="h-11 w-full"
      />
    </div>

    <UForm
      v-else
      :schema="schema"
      :state="state"
      class="space-y-4 rounded-xl border border-default bg-default p-6"
      @submit="onSubmit"
    >
      <UFormField
        :label="t('instructorHomeworks.title_label')"
        name="title"
        required
      >
        <UInput
          v-model="state.title"
          class="w-full"
          :placeholder="t('instructorHomeworks.title_label')"
        />
      </UFormField>

      <UFormField
        :label="t('instructorHomeworks.course')"
        name="course_id"
        required
      >
        <USelectMenu
          v-model="state.course_id"
          :items="courseItems"
          value-key="value"
          class="w-full"
          :placeholder="t('instructorHomeworks.course')"
        />
      </UFormField>

      <div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <UFormField
          :label="t('instructorHomeworks.start_date')"
          name="start_at"
          required
          :hint="lockStart ? t('instructorHomeworks.start_locked') : undefined"
        >
          <UInput
            v-model="state.start_at"
            type="datetime-local"
            class="w-full"
            :disabled="lockStart"
          />
        </UFormField>

        <UFormField
          :label="t('instructorHomeworks.end_date')"
          name="end_at"
          required
        >
          <UInput
            v-model="state.end_at"
            type="datetime-local"
            class="w-full"
            :min="state.start_at || undefined"
          />
        </UFormField>
      </div>

      <UFormField
        v-if="showTypePicker"
        :label="t('instructorHomeworks.test_type')"
        name="quiz_type"
        required
        :hint="isEdit ? t('instructorHomeworks.type_locked') : undefined"
      >
        <USelectMenu
          v-model="state.quiz_type"
          :items="typeItems"
          value-key="value"
          class="w-full"
          :disabled="isEdit"
        />
      </UFormField>

      <UCheckbox
        v-model="state.random_question"
        :label="t('instructorHomeworks.random_question')"
      />

      <div class="flex justify-end">
        <UButton
          type="submit"
          size="lg"
          :loading="store.isSubmitting"
        >
          {{ isEdit ? t('instructorHomeworks.save') : t('instructorHomeworks.start') }}
        </UButton>
      </div>
    </UForm>
  </div>
</template>
