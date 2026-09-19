<script setup lang="ts">
import { assessmentConfig, kindKey } from '~/types/assessmentKind'
import type { AssessmentKind } from '~/types/assessmentKind'
import { useAssessmentFormSchema } from '~/schemas/instructor/assessment-form-schema'
import type { AssessmentFormInput } from '~/schemas/instructor/assessment-form-schema'

const props = defineProps<{
  kind: AssessmentKind
  /** Absent when creating. */
  assessmentId?: string
}>()

const config = computed(() => assessmentConfig(props.kind))

const store = useInstructorAssessmentsStore()
const coursesStore = useInstructorCoursesStore()
const tenant = useTenant()
const localePath = useLocalePath()
const { t } = useI18n()

const isEdit = computed(() => Boolean(props.assessmentId))
const schema = computed(() => useAssessmentFormSchema(t, props.kind))

const state = reactive<AssessmentFormInput>({
  title: '',
  course_id: '',
  start_at: '',
  end_at: '',
  quiz_type: assessmentConfig(props.kind).defaultType,
  random_question: false
})

const courseItems = computed(() =>
  coursesStore.courses.map(c => ({ label: c.name, value: c.id })))

/** Exams offer quiz + final exam; the assignment side has only the one. */
const typeItems = computed(() => config.value.typeOptions.map(value => ({
  label: t(`instructorAssessments.types.${value}`),
  value
})))

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
    ? (await store.update(state.course_id, props.assessmentId!, payload) ? props.assessmentId! : null)
    : await store.create(state.course_id, payload)

  if (!id) return
  await navigateTo(localePath(`${config.value.authoringPath}/${state.course_id}/${id}/questions`))
}

onMounted(async () => {
  if (!coursesStore.courses.length) await coursesStore.fetchCourses()
  if (!props.assessmentId) return

  await store.fetchOne(props.assessmentId)
  const row = store.current
  if (!row) return
  Object.assign(state, {
    title: row.title,
    course_id: row.courseId,
    start_at: toDateTimeInput(row.startAt),
    end_at: toDateTimeInput(row.endAt),
    quiz_type: row.quizType || config.value.defaultType,
    random_question: row.randomQuestion
  })
})
</script>

<template>
  <div class="mx-auto max-w-3xl space-y-5">
    <div class="space-y-1">
      <h1 class="text-xl font-bold">
        {{ isEdit ? t(kindKey(kind, 'edit_title')) : t(kindKey(kind, 'create_title')) }}
      </h1>
      <p class="text-sm text-muted">
        {{ t(kindKey(kind, 'create_info')) }}
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
        :label="t(kindKey(kind, 'title_label'))"
        name="title"
        required
      >
        <UInput
          v-model="state.title"
          class="w-full"
          :placeholder="t(kindKey(kind, 'title_label'))"
        />
      </UFormField>

      <UFormField
        :label="t('instructorAssessments.course')"
        name="course_id"
        required
      >
        <USelectMenu
          v-model="state.course_id"
          :items="courseItems"
          value-key="value"
          class="w-full"
          :placeholder="t('instructorAssessments.course')"
        />
      </UFormField>

      <div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <UFormField
          :label="t('instructorAssessments.start_date')"
          name="start_at"
          required
          :hint="lockStart ? t('instructorAssessments.start_locked') : undefined"
        >
          <UInput
            v-model="state.start_at"
            type="datetime-local"
            class="w-full"
            :disabled="lockStart"
          />
        </UFormField>

        <UFormField
          :label="t('instructorAssessments.end_date')"
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
        :label="t(kindKey(kind, 'test_type'))"
        name="quiz_type"
        required
        :hint="isEdit ? t('instructorAssessments.type_locked') : undefined"
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
        :label="t('instructorAssessments.random_question')"
      />

      <div class="flex justify-end">
        <UButton
          type="submit"
          size="lg"
          :loading="store.isSubmitting"
        >
          {{ isEdit ? t('instructorAssessments.save') : t('instructorAssessments.start') }}
        </UButton>
      </div>
    </UForm>
  </div>
</template>
