<script setup lang="ts">
import { useContactFormSchema } from '~/schemas/contact/contact-form-schema'
import contactBanner from '~/assets/images/contact-us.webp'

definePageMeta({ layout: 'landing' })

const store = useContactStore()
const tenant = useTenant()
const { t } = useI18n()
const { $appToast } = useNuxtApp()

const schema = computed(() => useContactFormSchema(t))

function blankState() {
  return { first_name: '', last_name: '', email: '', mobile: '', message: '' }
}
const state = reactive(blankState())

const showDetails = computed(() => Boolean(tenant.features.config))

// Public page, public data — fetch on the server so the phone and email are
// in the delivered HTML rather than appearing a beat after hydration.
await useAsyncData('contact-config', async () => {
  if (showDetails.value) await store.fetchConfig()
  return true
})

const phone = computed(() => store.config.phone ?? '')
const email = computed(() => store.config.email ?? '')

/**
 * Legacy swapped the whole form out for a success card. Toasting instead keeps
 * the form on screen and ready for another message — the backend's own text is
 * still what's shown.
 */
async function onSubmit() {
  if (!await store.submit({ ...state })) return
  $appToast.success(store.successMessage.trim() || t('contact.success'))
  Object.assign(state, blankState())
  store.reset()
}

onMounted(() => store.reset())
</script>

<template>
  <div>
    <!-- Header: the legacy stacks its illustration above the title, centred. -->
    <section class="flex flex-col items-center gap-6 py-12">
      <img
        :src="contactBanner"
        alt=""
        class="max-w-full"
      >
      <h1 class="px-4 text-center text-3xl font-bold uppercase sm:text-5xl">
        {{ t('home.nav.contact_us') }}
      </h1>
    </section>

    <UContainer class="pb-12">
      <div class="grid grid-cols-1 gap-10 lg:grid-cols-2">
        <!-- Intro + contact details -->
        <div class="space-y-4">
          <h2 class="text-2xl font-bold">
            {{ t('contact.intro') }}
          </h2>
          <p class="text-muted">
            {{ t('contact.sub_intro') }}
          </p>

          <div
            v-if="showDetails && store.isLoadingConfig"
            class="flex flex-wrap gap-6 pt-2"
          >
            <USkeleton
              v-for="n in 2"
              :key="n"
              class="h-10 w-48"
            />
          </div>

          <div
            v-else-if="showDetails"
            class="flex flex-wrap gap-6 pt-2"
          >
            <a
              v-if="email"
              :href="`mailto:${email}`"
              class="flex items-center gap-2 text-sm transition hover:text-primary"
            >
              <span class="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10">
                <UIcon
                  name="i-lucide-mail"
                  class="h-5 w-5 text-primary"
                />
              </span>
              {{ email }}
            </a>

            <a
              v-if="phone"
              :href="`tel:${phone}`"
              class="flex items-center gap-2 text-sm transition hover:text-primary"
            >
              <span class="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10">
                <UIcon
                  name="i-lucide-phone"
                  class="h-5 w-5 text-primary"
                />
              </span>
              <!-- Phone numbers read left-to-right even in an RTL page. -->
              <span dir="ltr">{{ phone }}</span>
            </a>
          </div>
        </div>

        <!-- Form -->
        <UForm
          :schema="schema"
          :state="state"
          class="space-y-4"
          @submit="onSubmit"
        >
          <div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <UFormField
              :label="t('user.first_name')"
              name="first_name"
            >
              <UInput
                v-model="state.first_name"
                class="w-full"
                size="lg"
                :placeholder="t('user.pls_first_name')"
              />
            </UFormField>

            <UFormField
              :label="t('user.last_name')"
              name="last_name"
            >
              <UInput
                v-model="state.last_name"
                class="w-full"
                size="lg"
                :placeholder="t('user.pls_last_name')"
              />
            </UFormField>
          </div>

          <UFormField
            :label="t('user.email')"
            name="email"
          >
            <UInput
              v-model="state.email"
              type="email"
              class="w-full"
              size="lg"
              autocomplete="email"
              :placeholder="t('auth.login.identifier_placeholder')"
            />
          </UFormField>

          <UFormField
            :label="t('user.mobile')"
            name="mobile"
          >
            <UInput
              v-model="state.mobile"
              type="tel"
              class="w-full"
              size="lg"
              autocomplete="tel"
              :placeholder="t('auth.register.mobile_placeholder')"
            />
          </UFormField>

          <UFormField
            :label="t('contact.message')"
            name="message"
          >
            <UTextarea
              v-model="state.message"
              :rows="4"
              class="w-full"
              :placeholder="t('contact.message_placeholder')"
            />
          </UFormField>

          <UButton
            type="submit"
            size="lg"
            :loading="store.isSubmitting"
          >
            {{ t('contact.submit') }}
          </UButton>
        </UForm>
      </div>
    </UContainer>
  </div>
</template>
