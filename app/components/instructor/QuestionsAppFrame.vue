<script setup lang="ts">

export type QuestionsAppOperation = 'add' | 'edit' | 'view_as_student'

const props = defineProps<{
  operation: QuestionsAppOperation
  assessmentId: string
  /** Only for `add` — preselects the type in the editor. */
  questionType?: string | null
  /** Only for `edit` — the row being edited, passed through verbatim. */
  question?: unknown
}>()

const emit = defineEmits<{
  saved: [message: 'created' | 'edited']
  failed: [details: string[]]
}>()

const tenant = useTenant()
const auth = useAuthStore()
const { locale } = useI18n()

const frame = useTemplateRef<HTMLIFrameElement>('frame')
const isLoading = ref(true)
/** Grown by iframe-resizer messages; the fallback suits the editor's usual size. */
const frameHeight = ref(640)

const base = computed(() => (tenant.env.QUESTION_APP ?? '').replace(/\/$/, ''))

const src = computed(() => {
  if (!base.value) return ''

  const raw = auth.token || useCookie<string | null>('shaham_session').value || ''
  const token = !raw || /^Bearer\s/i.test(raw) ? raw : `Bearer ${raw}`

  const query = new URLSearchParams({
    mainOperation: props.operation,
    type: 'homework',
    userType: 'instructor',
    token,
    lang: String(locale.value)
  })
  if (props.questionType) {
    query.set('questionType', props.questionType)
  }
  return `${base.value}/${locale.value}?${query.toString()}`
})

/** Where replies are allowed to come from, and where ours are sent. */
const origin = computed(() => {
  try {
    return new URL(base.value).origin
  } catch {
    return ''
  }
})

function handshake() {
  isLoading.value = false
  const target = frame.value?.contentWindow
  if (!target || !origin.value) return

  const message = props.operation === 'view_as_student'
    ? { viewAsStudent: { generalQuizId: props.assessmentId, generalQuizType: 'homework' } }
    : props.operation === 'edit'
      ? { mainObject: { id: props.assessmentId }, question: props.question }
      : { mainObject: { id: props.assessmentId } }

  target.postMessage(message, origin.value)
}

function onMessage(event: MessageEvent) {
  if (event.source !== frame.value?.contentWindow) return

  if (typeof event.data === 'string' && event.data.startsWith('[iFrameSizer]')) {
    const height = Number(event.data.slice('[iFrameSizer]'.length).split(':')[1])
    if (Number.isFinite(height) && height > 0) frameHeight.value = height
    return
  }

  const data = event.data as {
    state?: string
    response?: { errors?: { detail?: string }[] }
  } | null

  switch (data?.state) {
    case 'questionSubmittedSuccesfuly':
      emit('saved', 'created')
      break
    case 'questionEditedSuccesfuly':
      emit('saved', 'edited')
      break
    case 'questionSubmittedWithError':
      emit('failed', (data.response?.errors ?? [])
        .map(e => e.detail)
        .filter((d): d is string => Boolean(d)))
      break
  }
}

onMounted(() => window.addEventListener('message', onMessage))
onBeforeUnmount(() => window.removeEventListener('message', onMessage))
</script>

<template>
  <div class="relative overflow-hidden rounded-xl border border-default bg-default">
    <p
      v-if="!base"
      class="p-6 text-center text-sm text-muted"
    >
      {{ $t('instructorAssessments.question_app_missing') }}
    </p>

    <template v-else>
      <div
        v-if="isLoading"
        class="space-y-3 p-6"
      >
        <USkeleton class="h-6 w-1/3" />
        <USkeleton class="h-40 w-full" />
      </div>

      <iframe
        ref="frame"
        :src="src"
        class="w-full"
        :style="isLoading ? { height: '0' } : { height: `${frameHeight}px` }"
        frameborder="0"
        :title="$t('instructorAssessments.question_editor')"
        @load="handshake"
      />
    </template>
  </div>
</template>
