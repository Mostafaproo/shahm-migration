<script setup lang="ts">
// Step 1 of 3 — ported from the legacy `pages/auth/forget-password.vue`.
// Sends the reset code, then hands the identifier to the OTP screen via the
// query string exactly like the legacy did (step 2 needs it to confirm AND to
// resend). Verified live: `POST auth/reset-password/send/code`.
import { useForgetPasswordFormSchema } from '~/schemas/auth/password-reset/forget-password-form-schema'

definePageMeta({ layout: 'auth' })

const { t } = useI18n()
const auth = useAuthStore()
const localePath = useLocalePath()
const { $appToast } = useNuxtApp()

const schema = computed(() => useForgetPasswordFormSchema(t))
const state = reactive({ identifier: '' })
const submitting = ref(false)

async function onSubmit() {
  submitting.value = true
  try {
    const message = await auth.sendResetCode(state.identifier.trim())
    if (message) $appToast.success(message)
    await navigateTo(localePath({
      path: '/auth/activation',
      query: { identifier: state.identifier.trim() }
    }))
  } catch {
    // The http client already surfaced the backend's own message
    // (e.g. "المستخدم غير موجود").
  } finally {
    submitting.value = false
  }
}
</script>

<template>
  <UCard :ui="{ body: 'p-8 sm:p-10' }">
    <div class="mb-8 space-y-2 text-center">
      <h1 class="text-xl font-bold">
        {{ t('auth.forgot.title') }}
      </h1>
      <p class="text-sm text-muted">
        {{ t('auth.forgot.subtitle') }}
      </p>
    </div>

    <UForm
      :schema="schema"
      :state="state"
      class="space-y-5"
      @submit="onSubmit"
    >
      <UFormField
        :label="t('auth.forgot.identifier')"
        name="identifier"
      >
        <UInput
          v-model="state.identifier"
          class="w-full"
          size="lg"
          autocomplete="username"
          :placeholder="t('auth.login.identifier_placeholder')"
        />
      </UFormField>

      <UButton
        type="submit"
        block
        size="lg"
        :loading="submitting"
      >
        {{ t('auth.forgot.submit') }}
      </UButton>

      <NuxtLink
        :to="localePath('/auth/login')"
        class="block text-center text-sm text-muted hover:text-primary"
      >
        {{ t('auth.forgot.back_to_login') }}
      </NuxtLink>
    </UForm>
  </UCard>
</template>
