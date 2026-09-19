<script setup lang="ts">
import type { CkEditorInstance } from '~/composables/useCkEditorLoader'

const props = withDefaults(
  defineProps<{
    modelValue?: string
    hasLimit?: boolean
    disabled?: boolean
    /** Defaults to the active i18n locale. */
    language?: string
    /** Defaults to the active locale's direction. */
    contentsLangDirection?: 'rtl' | 'ltr'
  }>(),
  {
    modelValue: '',
    hasLimit: false,
    disabled: false,
    language: undefined,
    contentsLangDirection: undefined
  }
)

const emit = defineEmits<{
  'update:modelValue': [value: string]
  'ready': []
  'error': [error: unknown]
}>()

const { t, locale } = useI18n()
const { $appToast } = useNuxtApp()
const { load } = useCkEditorLoader()
const runtimeConfig = useRuntimeConfig()

const resolvedLanguage = computed(() => props.language || locale.value)
const resolvedDirection = computed<'rtl' | 'ltr'>(
  () => props.contentsLangDirection ?? (locale.value === 'ar' ? 'rtl' : 'ltr')
)

// WIRIS is unlicensed-free on localhost; a real domain needs the key.
const apiKey = computed(() => String(runtimeConfig.public.CKEDITOR_KEY ?? ''))

const REMOVE_PLUGINS
  = 'scayt,forms,iframe,about,pagebreak,templates,image,showblocks,newpage,'
    + 'language,print,div,blockquote,save,flash,preview,form,find'
const EXTRA_PLUGINS = 'divarea,easyimage,emoji,ckeditor_wiris'
const N1ED_PLUGIN_URL = 'https://admin.ta3lom.com/'
const WIRIS_PLUGIN_URL
  = 'https://ckeditor.com/docs/ckeditor4/4.16.0/examples/assets/plugins/ckeditor_wiris/'
const PLAIN_TEXT_LIMIT = 220

// MathML elements WIRIS emits. Without this whitelist CKEditor's content
// filter strips every formula on save.
const MATHML_TAGS = [
  'math', 'maction', 'maligngroup', 'malignmark', 'menclose', 'merror',
  'mfenced', 'mfrac', 'mglyph', 'mi', 'mlabeledtr', 'mlongdiv',
  'mmultiscripts', 'mn', 'mo', 'mover', 'mpadded', 'mphantom', 'mroot',
  'mrow', 'ms', 'mscarries', 'mscarry', 'msgroup', 'msline', 'mspace',
  'msqrt', 'msrow', 'mstack', 'mstyle', 'msub', 'msup', 'msubsup',
  'mtable', 'mtd', 'mtext', 'mtr', 'munder', 'munderover', 'semantics',
  'annotation', 'annotation-xml'
]

const EXTRA_ALLOWED_CONTENT
  = `${MATHML_TAGS.join(' ')}(*)[*]{*};img[data-mathml,data-custom-editor,role](Wirisformula)`

const host = ref<HTMLDivElement | null>(null)
const instance = shallowRef<CkEditorInstance | null>(null)
const failed = ref(false)

/** Guards the change handler while a prop-driven value is pushed in. */
let applyingExternal = false

function stripTags(html: string): string {
  return html ? html.replace(/(<([^>]+)>)/gi, '') : ''
}

function checkLimit(html: string) {
  if (!props.hasLimit) return
  if (stripTags(html).length > PLAIN_TEXT_LIMIT) {
    $appToast.error(t('editor.limit_exceeded'))
  }
}

onMounted(async () => {
  try {
    const CKEDITOR = await load()

    // Silence the end-of-life nag, register the external plugins.
    CKEDITOR.config.versionCheck = false
    CKEDITOR.plugins.addExternal('N1ED-editor', N1ED_PLUGIN_URL, 'plugin.js')
    CKEDITOR.plugins.addExternal('ckeditor_wiris', WIRIS_PLUGIN_URL, 'plugin.js')

    if (!host.value) return

    const editor = CKEDITOR.replace(host.value, {
      versionCheck: false,
      removePlugins: REMOVE_PLUGINS,
      extraPlugins: EXTRA_PLUGINS,
      extraAllowedContent: EXTRA_ALLOWED_CONTENT,
      apiKey: apiKey.value,
      language: resolvedLanguage.value,
      contentsLangDirection: resolvedDirection.value,
      readOnly: props.disabled
    })

    instance.value = editor
    editor.setData(props.modelValue)

    editor.on('change', () => {
      if (applyingExternal) return
      const data = editor.getData()
      emit('update:modelValue', data)
      checkLimit(data)
    })

    emit('ready')
  } catch (error) {
    failed.value = true
    emit('error', error)
  }
})

watch(
  () => props.modelValue,
  (value) => {
    const editor = instance.value
    if (!editor || editor.getData() === value) return
    applyingExternal = true
    editor.setData(value ?? '')
    applyingExternal = false
  }
)

onBeforeUnmount(() => {
  instance.value?.destroy(true)
  instance.value = null
})
</script>

<template>
  <div :class="resolvedDirection === 'rtl' ? 'ck-host-rtl' : undefined">
    <UAlert
      v-if="failed"
      color="error"
      variant="subtle"
      icon="i-lucide-triangle-alert"
      :title="t('editor.load_failed')"
    />
    <div
      v-show="!failed"
      ref="host"
    />
  </div>
</template>

<!-- Global on purpose: WIRIS and CKEditor mount their dialogs on <body>, so a
     scoped block would never reach them. -->
<style>
/* Stack above CKEditor's own float layer (baseFloatZIndex 10000) and any
   Nuxt UI overlay, so the math dialog opens on top of the editor. */
.wrs_modal_overlay {
  z-index: 10040 !important;
}

.wrs_modal_dialogContainer {
  z-index: 10050 !important;
}

.wrs_modal_dialogContainer.wrs_modal_desktop.wrs_stack {
  right: 35% !important;
}

/* Scoped to RTL instances so an LTR editor is not force-aligned. */
.ck-host-rtl .cke_editable {
  text-align: right;
}

.cke_bottom .jsplus_ui_breadcrumbs.jsplus_ui_breadcrumbs--xs {
  display: flex !important;
}
</style>
