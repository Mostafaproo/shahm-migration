<script setup lang="ts">
/**
 * The question editor is not part of this app — it is a separate product
 * embedded in an iframe at `tenant.env.QUESTION_APP`, driven entirely by
 * query params and `postMessage`. Migrating it means reproducing that
 * protocol, not rebuilding an editor.
 *
 * Protocol, both directions:
 *   out, once the frame loads — { mainObject: { id } }            (add)
 *                              + { question }                      (edit)
 *                              | { viewAsStudent: { … } }          (preview)
 *   in, on window 'message'   — event.data.state:
 *                                 questionSubmittedSuccesfuly
 *                                 questionEditedSuccesfuly
 *                                 questionSubmittedWithError
 *
 * Three things the legacy got wrong and this does not:
 *  - it assigned `window.onmessage`, clobbering any other listener on the page
 *    and never removing it; this adds and removes its own.
 *  - it posted to `'*'`, i.e. to whatever happens to be framed. This targets
 *    the question app's own origin, so the homework id and token are not
 *    broadcast to a frame that got swapped underneath it. Replies are matched
 *    on the source window instead, which survives a redirect inside the frame.
 *  - it gave every frame `id="iframe"` and resolved the post target with
 *    `getElementById`, so with two editors open the messages went to whichever
 *    came first in the DOM. Each instance holds its own ref.
 */
export type QuestionsAppOperation = 'add' | 'edit' | 'view_as_student'

const props = defineProps<{
  operation: QuestionsAppOperation
  homeworkId: string
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

  // The question app forwards this value straight into its `Authorization`
  // header, so it has to carry the scheme. The legacy passed
  // `$auth.getToken('local')`, and @nuxtjs/auth stores the token already
  // prefixed (`tokenType: 'Bearer'` by default) — this store does not, so the
  // prefix is added here. Without it the app's own calls come back 500.
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
    ? { viewAsStudent: { generalQuizId: props.homeworkId, generalQuizType: 'homework' } }
    : props.operation === 'edit'
      ? { mainObject: { id: props.homeworkId }, question: props.question }
      : { mainObject: { id: props.homeworkId } }

  target.postMessage(message, origin.value)
}

function onMessage(event: MessageEvent) {
  // Tie replies to THIS frame rather than to a literal origin string: the
  // question app may redirect (auth, a CDN host) and an origin comparison
  // would then silently drop every reply. Comparing the source window is both
  // stricter than the legacy's accept-anything and immune to that.
  if (event.source !== frame.value?.contentWindow) return

  // The question app ships iframe-resizer's child script, which announces its
  // height as `[iFrameSizer]<id>:<height>:<width>:<type>`. Reading that here
  // gives the legacy's auto-grow without pulling in the parent library — the
  // editor is far taller than any fixed height would guess.
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
      {{ $t('instructorHomeworks.question_app_missing') }}
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
        :title="$t('instructorHomeworks.question_editor')"
        @load="handshake"
      />
    </template>
  </div>
</template>
